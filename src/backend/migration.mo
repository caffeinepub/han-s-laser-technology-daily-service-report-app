import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

module {
  type DailyServiceReport = {
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

  type Geolocation = {
    latitude : Float;
    longitude : Float;
  };

  type OldRole = {
    #engineer;
    #admin;
  };

  type OldUserProfile = {
    name : Text;
    username : Text;
    mobileNumber : Text;
    email : Text;
    role : OldRole;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    adminAllowlist : Map.Map<Text, ()>;
    adminSignupPassword : Text;
    pendingSignups : Map.Map<Principal, OldUserProfile>;
    reports : Map.Map<Text, DailyServiceReport>;
    reportCounter : Nat;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewRole = {
    #engineer;
    #admin;
  };

  type NewUserProfile = {
    name : Text;
    username : Text;
    mobileNumber : Text;
    email : Text;
    role : NewRole;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    adminAllowlist : Map.Map<Text, ()>;
    adminSignupPassword : Text;
    pendingSignups : Map.Map<Principal, NewUserProfile>;
    reports : Map.Map<Text, DailyServiceReport>;
    reportCounter : Nat;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  func shouldAutoUpgradeToAdmin(profile : NewUserProfile) : Bool {
    switch (profile.role) {
      case (#admin) {
        let trimmedUsername = profile.username.trim(#text(" "));
        trimmedUsername == "sayedbaquar" or trimmedUsername == "bharatnikam";
      };
      case (_) { false };
    };
  };

  func mapAndUpgradeProfiles(oldMap : Map.Map<Principal, OldUserProfile>) : Map.Map<Principal, NewUserProfile> {
    oldMap.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        let upgradedProfile = {
          oldProfile with
          role = if (shouldAutoUpgradeToAdmin(oldProfile)) { #admin } else {
            #engineer;
          };
        };
        if (shouldAutoUpgradeToAdmin(upgradedProfile)) {
          upgradedProfile;
        } else if (upgradedProfile.role == #engineer) {
          {
            upgradedProfile with role = #engineer;
          };
        } else {
          upgradedProfile;
        };
      }
    );
  };

  public func run(old : OldActor) : NewActor {
    let mappedUserProfiles = mapAndUpgradeProfiles(old.userProfiles);
    let mappedPendingSignups = mapAndUpgradeProfiles(old.pendingSignups);

    {
      old with
      adminAllowlist = Map.empty<Text, ()>();
      adminSignupPassword = "Hans@987123";
      userProfiles = mappedUserProfiles;
      pendingSignups = mappedPendingSignups;
    };
  };
};
