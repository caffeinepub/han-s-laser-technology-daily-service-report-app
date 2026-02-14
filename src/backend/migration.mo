import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  type Role = {
    #engineer;
    #admin;
  };

  type UserProfile = {
    name : Text;
    username : Text;
    mobileNumber : Text;
    email : Text;
    role : Role;
  };

  type Actor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    pendingSignups : Map.Map<Principal, UserProfile>;
  };

  func updateProfileRole(profile : UserProfile) : UserProfile {
    if (profile.username == "sayedbaquar") {
      {
        profile with
        role = #admin;
      };
    } else {
      profile;
    };
  };

  public func run(old : Actor) : Actor {
    let updatedUserProfiles = old.userProfiles.map<Principal, UserProfile, UserProfile>(
      func(_principal, profile) { updateProfileRole(profile) }
    );

    let updatedPendingSignups = old.pendingSignups.map<Principal, UserProfile, UserProfile>(
      func(_principal, profile) { updateProfileRole(profile) }
    );

    { old with userProfiles = updatedUserProfiles; pendingSignups = updatedPendingSignups };
  };
};
