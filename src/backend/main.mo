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

  public type Geolocation = {
    latitude : Float;
    longitude : Float;
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
    geolocation : ?Geolocation;
  };

  func createAllowlist() : Map.Map<Text, ()> {
    let allowlist = Map.empty<Text, ()>();
    let names = [
      "Admin Name1",
      "Admin Name2",
    ];
    for (name in names.values()) {
      allowlist.add(name, ());
    };
    allowlist;
  };

  let adminAllowlist = createAllowlist();
  let adminSignupPassword = "SecurePassword123";
  let userProfiles = Map.empty<Principal, UserProfile>();
  let reports = Map.empty<Text, DailyServiceReport>();
  let pendingSignups = Map.empty<Principal, UserProfile>();

  func isAllowlistedAdmin(profile : UserProfile) : Bool {
    let trimmedName = profile.name.trim(#text(" "));
    switch (adminAllowlist.get(trimmedName)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func determineAccessControlRole(profile : UserProfile) : AccessControl.UserRole {
    if (profile.role == #admin and isAllowlistedAdmin(profile)) {
      #admin;
    } else { #user };
  };

  public shared ({ caller }) func resetToFreshApp() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can perform a full system reset");
    };

    // Collect all known principals before clearing data structures
    let allPrincipals = Map.empty<Principal, ()>();

    // Add all principals from userProfiles
    for ((principal, _) in userProfiles.entries()) {
      allPrincipals.add(principal, ());
    };

    // Add all principals from pendingSignups
    for ((principal, _) in pendingSignups.entries()) {
      allPrincipals.add(principal, ());
    };

    // Add all principals from reports (createdBy field)
    for ((_, report) in reports.entries()) {
      allPrincipals.add(report.createdBy, ());
    };

    // Add the caller to ensure their role is also revoked
    allPrincipals.add(caller, ());

    // Clear all data structures
    reports.clear();
    userProfiles.clear();
    pendingSignups.clear();

    // Revoke access-control roles for all known principals including the caller
    // We need an admin to perform the role assignment, so we temporarily use the caller
    // who is still an admin at this point
    for ((principal, _) in allPrincipals.entries()) {
      AccessControl.assignRole(accessControlState, caller, principal, #guest);
    };
  };

  public shared ({ caller }) func signupWithRole(profile : UserProfile, requestedRole : Role) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot sign up. Please authenticate first.");
    };

    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Profile already exists. Use \"update profile\" instead.");
    };

    let sanitizedProfile : UserProfile = {
      profile with
      name = profile.name.trim(#text(" "));
      role = if (isAllowlistedAdmin({ profile with name = profile.name.trim(#text(" ")) })) {
        requestedRole;
      } else {
        #engineer; // Force non-allowlisted users to engineer role
      };
    };

    userProfiles.add(caller, sanitizedProfile);
    pendingSignups.add(caller, sanitizedProfile);
  };

  public shared ({ caller }) func signupAdmin(profile : UserProfile, password : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot sign up. Please authenticate first.");
    };

    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Profile already exists. Use \"update profile\" instead.");
    };

    if (password != adminSignupPassword) {
      Runtime.trap("Admin signup failed: Incorrect signup password");
    };

    if (not isAllowlistedAdmin(profile)) {
      Runtime.trap("Admin signup failed: An admin profile with this name is not on the allowlist. Please contact your system administrator for additional permissions.");
    };

    let sanitizedProfile : UserProfile = {
      profile with
      name = profile.name.trim(#text(" "));
      role = #admin;
    };

    userProfiles.add(caller, sanitizedProfile);
    pendingSignups.add(caller, sanitizedProfile);
  };

  public shared ({ caller }) func processPendingSignups() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can process pending signups");
    };

    var processed : Nat = 0;
    let entries = pendingSignups.entries().toArray();

    for ((principal, profile) in entries.values()) {
      let accessControlRole = determineAccessControlRole(profile);
      AccessControl.assignRole(accessControlState, caller, principal, accessControlRole);
      pendingSignups.remove(principal);
      processed += 1;
    };

    processed;
  };

  public query ({ caller }) func getPendingSignupsCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending signups");
    };
    pendingSignups.size();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile does not exist. Please complete signup first.");
      };
      case (?p) { p };
    };

    let finalRole = if (isAllowlistedAdmin({ profile with name = profile.name.trim(#text(" ")) })) {
      existingProfile.role;
    } else { #engineer };

    let updatedProfile = {
      name = profile.name.trim(#text(" "));
      username = profile.username;
      mobileNumber = profile.mobileNumber;
      email = profile.email;
      role = finalRole;
    };
    userProfiles.add(caller, updatedProfile);

    if (isAllowlistedAdmin(updatedProfile) and updatedProfile.role == #admin) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
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
        let finalRole = if (newRole == #admin and not isAllowlistedAdmin(existingProfile)) {
          #engineer;
        } else { newRole };

        let updatedProfile = {
          existingProfile with
          name = existingProfile.name.trim(#text(" "));
          role = finalRole;
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
        pendingSignups.remove(user);
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
      case (null) { return null };
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

  // Securely fetch reports for CSV download (non-admins only get their own reports)
  public query ({ caller }) func getReportsForDownload() : async [DailyServiceReport] {
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
};

