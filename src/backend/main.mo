import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Role = {
    #engineer;
    #admin;
  };

  public type UserProfile = {
    name : Text;
    username : Text;
    mobileNumber : Text;
    email : Text;
    role : Role;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    verifyUserHasProfile(caller, "access your profile");
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    verifyUserHasProfile(caller, "update profile");
    let updatedProfile = {
      name = profile.name;
      username = profile.username;
      mobileNumber = profile.mobileNumber;
      email = profile.email;
      role = #engineer; // Engineers can only update their own profile, role is not changed here.
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func signupWithCode(profile : UserProfile, accessCode : Text) : async () {
    if (accessCode != "646151") {
      Runtime.trap("Invalid Access Code. Contact Admin for support.");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let sanitizedProfile = {
          name = profile.name;
          username = profile.username;
          mobileNumber = profile.mobileNumber;
          email = profile.email;
          role = #engineer; // All new signups are engineers
        };
        AccessControl.assignRole(accessControlState, caller, caller, #user);
        userProfiles.add(caller, sanitizedProfile);
      };
      case (?_) {
        Runtime.trap("Profile already exists. Use \"update profile\" instead.");
      };
    };
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : Role) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can change user roles");
    };

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?existingProfile) {
        let updatedProfile = {
          name = existingProfile.name;
          username = existingProfile.username;
          mobileNumber = existingProfile.mobileNumber;
          email = existingProfile.email;
          role = newRole;
        };

        let accessControlRole : AccessControl.UserRole = switch (newRole) {
          case (#admin) { #admin };
          case (#engineer) { #user };
        };

        AccessControl.assignRole(accessControlState, caller, user, accessControlRole);
        userProfiles.add(user, updatedProfile);
      };
    };
  };

  public query ({ caller }) func listUsers() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can list users");
    };
    userProfiles.entries().toArray();
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can delete users");
    };

    if (caller == user) {
      Runtime.trap("Cannot delete your own account");
    };

    AccessControl.assignRole(accessControlState, caller, user, #guest); // Remove authorization role first

    userProfiles.remove(user);
    let reportsToRemove = reports.entries().filter(
      func(entry : (Text, DailyServiceReport)) : Bool {
        entry.1.createdBy == user;
      }
    );
    for ((id, _) in reportsToRemove) {
      reports.remove(id);
    };
  };

  func verifyUserHasProfile(userId : Principal, action : Text) {
    if (not AccessControl.hasPermission(accessControlState, userId, #user)) {
      Runtime.trap("You do not have sufficient permissions to " # action # ". " #
      "Please contact the admin for assistance.");
    };

    switch (userProfiles.get(userId)) {
      case (null) {
        Runtime.trap("User profile does not exist. Please complete sign up first.");
      };
      case (?_) {};
    };
  };

  public type DailyServiceReport = {
    id : Text;
    createdBy : Principal;
    date : Text;
    customerName : Text;
    contactPerson : Text;
    mobileNumber : Text;
    machineModel : Text;
    machineSerialNo : Text;
    warrantyStatus : Text;
    travelingExpensePaid : Bool;
    issueDescribedByCustomer : Text;
    issueFoundByEngineer : Text;
    solution : Text;
    issueResolved : Bool;
    nextPlanOfAction : ?Text;
    sparesRequired : Text;
    customerFeedback : Text;
  };

  public shared ({ caller }) func createReport(report : DailyServiceReport) : async Text {
    verifyUserHasProfile(caller, "create reports");

    if (reports.containsKey(report.id)) {
      Runtime.trap("Report with ID " # report.id # " already exists. " #
      "Choose a unique ID for the new report. ");
    };

    let reportWithCaller = { report with createdBy = caller };
    reports.add(report.id, reportWithCaller);
    report.id;
  };

  public query ({ caller }) func listReports() : async [DailyServiceReport] {
    verifyUserHasProfile(caller, "access reports");

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return reports.values().toArray();
    };

    reports.values().toArray().filter(
      func(report : DailyServiceReport) : Bool { report.createdBy == caller }
    );
  };

  public query ({ caller }) func getReportById(id : Text) : async ?DailyServiceReport {
    verifyUserHasProfile(caller, "get reports");

    let report = switch (reports.get(id)) {
      case (null) {
        return null;
      };
      case (?r) { r };
    };

    if (AccessControl.isAdmin(accessControlState, caller) or report.createdBy == caller) {
      return ?report;
    };

    Runtime.trap(
      "Unauthorized: You do not have sufficient permissions to view this report. " #
      "Please contact the admin if you require additional access."
    );
  };

  public shared ({ caller }) func purgeLegacyReportsAndUsers() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can delete users");
    };
    reports.clear();
    let filteredUser = Map.empty<Principal, UserProfile>();
    for ((principal, user_profile) in userProfiles.entries()) {
      if (principal == caller) {
        filteredUser.add(principal, user_profile);
      } else {
        AccessControl.assignRole(accessControlState, caller, principal, #guest);
      };
    };
    userProfiles.clear();
    for ((principal, user_profile) in filteredUser.entries()) {
      userProfiles.add(principal, user_profile);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let reports = Map.empty<Text, DailyServiceReport>();
};
