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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let reports = Map.empty<Text, DailyServiceReport>();

  func isAdminAllowlisted(profile : UserProfile) : Bool {
    let trimmedName = profile.name.trim(#text(" "));
    trimmedName == "sayed baquar" or trimmedName == "Bharat Nikam";
  };

  func determineAccessControlRole(profile : UserProfile) : AccessControl.UserRole {
    if (profile.role == #admin or isAdminAllowlisted(profile)) {
      #admin;
    } else {
      #user;
    };
  };

  func ensureAllowlistedAdminStatus(caller : Principal, profile : UserProfile) : () {
    if (isAdminAllowlisted(profile)) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    };
  };

  public shared ({ caller }) func resetToFreshApp() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can perform a full system reset");
    };

    reports.clear();
    let allUsers = userProfiles.keys().toArray();
    userProfiles.clear();
    for (user in allUsers.vals()) {
      AccessControl.assignRole(accessControlState, caller, user, #guest);
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // No authorization check - allow any caller (including guests/new users) to check their profile status
    // Returns null if no profile exists, enabling new-user signup flow
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile does not exist. Please complete sign up first.");
      };
      case (?p) { p };
    };

    let updatedProfile = {
      name = profile.name;
      username = profile.username;
      mobileNumber = profile.mobileNumber;
      email = profile.email;
      role = existingProfile.role;
    };
    userProfiles.add(caller, updatedProfile);

    ensureAllowlistedAdminStatus(caller, updatedProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func signupWithRole(profile : UserProfile, requestedRole : Role) : async () {
    // No authorization check - allow any authenticated principal (including guests) to sign up
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Profile already exists. Use \"update profile\" instead.");
    };

    let assignedRole = requestedRole;
    let sanitizedProfile : UserProfile = {
      name = profile.name;
      username = profile.username;
      mobileNumber = profile.mobileNumber;
      email = profile.email;
      role = assignedRole;
    };

    userProfiles.add(caller, sanitizedProfile);
    let accessControlRole = determineAccessControlRole(sanitizedProfile);
    AccessControl.assignRole(accessControlState, caller, caller, accessControlRole);
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

        let accessControlRole = determineAccessControlRole(updatedProfile);
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

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?_) {
        userProfiles.remove(user);
      };
    };

    AccessControl.assignRole(accessControlState, caller, user, #guest);

    let reportsToRemove = reports.entries().filter(
      func(entry : (Text, DailyServiceReport)) : Bool {
        entry.1.createdBy == user;
      }
    );
    for ((id, _) in reportsToRemove) {
      reports.remove(id);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reports");
    };

    if (reports.containsKey(report.id)) {
      Runtime.trap("Report with ID " # report.id # " already exists. " #
      "Choose a unique ID for the new report.");
    };

    let reportWithCaller = { report with createdBy = caller };
    reports.add(report.id, reportWithCaller);
    report.id;
  };

  public query ({ caller }) func listReports() : async [DailyServiceReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access reports");
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return reports.values().toArray();
    };

    reports.values().toArray().filter(
      func(report : DailyServiceReport) : Bool { report.createdBy == caller }
    );
  };

  public query ({ caller }) func getReportById(id : Text) : async ?DailyServiceReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get reports");
    };

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
      Runtime.trap("Unauthorized: Only admin can purge data");
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
};
