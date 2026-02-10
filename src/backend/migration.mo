import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

module {
  type DailyServiceReportOld = {
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

  type DailyServiceReportNew = {
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
    geolocation : ?{ latitude : Float; longitude : Float };
  };

  type OldActor = {
    reports : Map.Map<Text, DailyServiceReportOld>;
  };

  type NewActor = {
    reports : Map.Map<Text, DailyServiceReportNew>;
  };

  public func run(old : OldActor) : NewActor {
    let migratedReports = old.reports.map<Text, DailyServiceReportOld, DailyServiceReportNew>(
      func(_id, report) {
        { report with geolocation = null };
      }
    );
    { reports = migratedReports };
  };
};
