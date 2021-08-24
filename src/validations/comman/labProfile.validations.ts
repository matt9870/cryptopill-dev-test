import {
  IsNotEmpty,
  IsMobilePhone,
  IsNumber,
  IsDefined,
  Matches,
  IsPositive,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
  IsString,
  IsIn,
  Min,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsAlphanumeric,
  MinLength,
  IsLatitude,
  IsLongitude,
} from "class-validator";
import { Type } from 'class-transformer';
import { AddressDetails, EditAddressDetails } from "./address.validations";
import { Employee, AddEmployee } from "./users.validation";
import { PreviousOrder } from "./basicInfo.validations";

class LabDeliveryProfile {
  @IsNumber()
  @IsNotEmpty()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  delivery_customer: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: "value cant be less than zero" })
  delivery_distance: number;
}

class Workplace extends LabDeliveryProfile {
  @IsNotEmpty({ message: "Workplace name is required" })
  @IsString()
  workplace_name: string;

  @IsNotEmpty({ message: "Franchise case is required" })
  @IsNumber()
  is_franchise: number;

  @IsString()
  franchise_name: string;

  // @IsString()
  // @IsNotEmpty({message: "Phone number can't be empty"})
  // @IsMobilePhone(null, {
  //     strictMode: true
  // }, { message: "Please provide valid countrycode" })
  phone_number: string

  @IsNotEmpty({ message: "License number is required" })
  @IsString()
  license_number: string;

  @IsNotEmpty({ message: "GST number is required" })
  @IsString()
  gst_number: string;
}

class WorkplaceDetails {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDetails)
  address: AddressDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Workplace)
  workplace: Workplace;
}

class LabProfile {

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => WorkplaceDetails)
  workplaces: WorkplaceDetails[];

  @IsNotEmpty({ message: "User id is required" })
  @IsNumber()
  user_id: Number;
}

export class LabSetUpProfile {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => LabProfile)
  laboratoryDetails: LabProfile;

  @IsNotEmpty({ message: "user role is required" })
  @IsNumber()
  @IsPositive({ message: "user role must be valid" })
  user_role: number
}

export class LabEmployee extends Employee {
  @IsNumber()
  @IsNotEmpty({ message: "Role Id can't be empty" })
  @IsPositive({ message: "Not a valid Role Id" })
  role_id: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  edit_profile: number; //does have access to edit lab profile
}

export class EditLabEmployee extends LabEmployee {

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  id: number;

}
class EditWorkplace extends Workplace {
  @IsNotEmpty({ message: "WorkplaceID is required" })
  @IsNumber()
  @IsPositive()
  workplace_id: number;
}

class EditWorkplaceDetails {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditAddressDetails)
  address: EditAddressDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditWorkplace)
  workplace: EditWorkplace;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, {
    message: "There must be atleast one employee in a Laboratory",
  })
  @Type(() => AddEmployee)
  employees: AddEmployee[];
}

class EditLabProfile {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EditWorkplaceDetails)
  workplaces: EditWorkplaceDetails[];
}

export class EditLabSetUpProfile {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => EditLabProfile)
  laboratoryDetails: EditLabProfile;

  @IsNotEmpty({ message: "user role is required" })
  @IsNumber()
  @IsPositive({ message: "user role must be valid" })
  user_role: number;
}

export class EditLabUserProfile {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @Type(() => Employee)
  personal_information: Employee;
}

class TestInfo {
  @IsNotEmpty({ message: "cost is required" })
  @IsNumber()
  @IsPositive()
  cost: number;

  @IsNotEmpty({ message: "home_collection_charges is required" })
  @IsNumber()
  home_collection_charges: number;

  @IsNotEmpty({ message: "tests_id can't be empty" })
  @IsNumber()
  @IsPositive()
  tests_id: number;

  @IsNotEmpty({ message: "lab_id can't be empty" })
  @IsNumber()
  @IsPositive()
  lab_id: number;

  @IsNotEmpty({ message: "home_collection can't be empty" })
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  home_collection: number;
}

export class LabTestProfile {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TestInfo)
  test_info: TestInfo[];
}

export class LabTestSearch {
  @IsPositive()
  limit: number = 10;

  @IsNumber()
  offset: number = 0;

  @IsNumber()
  lab_id: number;

  @IsOptional()
  @MinLength(1, { message: "Please add atleast one character" })
  search: string;
}

export class LabOrders {
  @IsPositive()
  limit: number = 10;

  @IsNumber()
  offset: number = 0;
}

export class LabPastOrders extends LabOrders {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "birth date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
      message: "Date Format must be in YYYY-MM-DD format",
  })
  date: string
}

class RequestLaboratory {
  @IsNotEmpty({ message: "patientID is required" })
  @IsNumber()
  @IsPositive()
  patient_id: number;

  @IsIn(["Electronic", "Scanned"])
  prescription_type: string;

  @IsIn(["Request"])
  order_type: string;

  @IsIn(["Pickup", "Delivery"])
  order_status: string;
}

class Tests {
  @IsNotEmpty({ message: "testID is required" })
  @IsNumber()
  @IsPositive()
  test_id: number;

  @IsNotEmpty({ message: "TestName is required" })
  test_name: string;

  details: string;

  @IsIn([0, 1])
  patient_home_collection: number;
}
class ElectronicPrescriptions {
  //@IsNotEmpty({ message: "prescriptionID is required" })
  //@IsNumber()
  //@IsPositive()
  prescriptions_id: number;

  @IsIn([0, 1])
  is_repeatable_prescriptions: number;

  @IsNotEmpty({ message: "doctorID is required" })
  @IsNumber()
  @IsPositive()
  doctor_id: number;

  @IsNotEmpty({ message: "bookingID is required" })
  @IsNumber()
  @IsPositive()
  booking_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: "There must be atleast one Tests in a Prescription" })
  @Type(() => Tests)
  tests: Tests[];
}
export class LabOrderRequest {
  @IsNotEmpty({ message: "Latitude can't be empty" })
  @IsLatitude()
  latitude: number;

  @IsNotEmpty({ message: "Longitude can't be empty" })
  @IsLongitude()
  longitude: number;

  @IsNotEmpty({ message: "Search Radius can't be empty" })
  @IsPositive({ message: "Search Radius must be greater than zero" })
  searchRadius: number;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RequestLaboratory)
  requestLab: RequestLaboratory;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: "Patient must add atleast 1 prescription" })
  @Type(() => ElectronicPrescriptions)
  prescriptions: ElectronicPrescriptions[];
}

class LabPreviousOrder extends PreviousOrder { };
export class ReOrderLabRequest {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @Type(() => LabPreviousOrder)
  previous_order_details: LabPreviousOrder;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RequestLaboratory)
  requestLab: RequestLaboratory;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: "Patient must add atleast 1 prescription" })
  @Type(() => ElectronicPrescriptions)
  prescriptions: ElectronicPrescriptions[];
}

export class LabCancelOrder {
  @IsNotEmpty({ message: "OrderId is required" })
  @IsString()
  order_id: string;

  @IsNotEmpty({ message: "LabID is required" })
  @IsNumber()
  @IsPositive()
  lab_id: number;

  @IsNotEmpty({ message: "Cancellation Reason is Required" })
  @IsString()
  cancel_reason: string;

  @IsNotEmpty({ message: "OrderRequestLabID is required" })
  @IsNumber()
  @IsPositive()
  order_request_lab_id: number;
}

export class LabMarkOrderAsDelivered {
  @IsNotEmpty({ message: "OrderRequestLabID is required" })
  @IsNumber()
  @IsPositive()
  order_request_lab_id: number;
}

class RequestLabOrder {
  @IsNotEmpty({ message: "RequestLabID is required" })
  @IsNumber()
  @IsPositive()
  request_lab_id: number;
}
class OrderedTests {
  @IsNotEmpty({ message: "LabTestID is required" })
  @IsNumber()
  @IsPositive()
  lab_test_id: number;

  @IsIn([0, 1])
  is_lab_selected: number;
}
class OrderedElectronicPrescriptions {
  @IsNotEmpty({ message: "PrescribeOrderID is required" })
  @IsNumber()
  @IsPositive()
  prescribed_order_id: number;

  //@IsNotEmpty({ message: "PrescriptionID is required" })
  //@IsNumber()
  //@IsPositive()
  prescriptions_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: "Lab Order must have atleast 1 Test" })
  @Type(() => OrderedTests)
  tests: OrderedTests; 
}

class OrderSummary {
  @IsIn([0, 1])
  home_delivery: number;

  @IsNotEmpty({ message: "Test Price is required" })
  @IsNumber()
  selected_test_price: number;
  
  @IsNotEmpty({ message: "Total is required" })
  @IsNumber()
  total: number;
}
export class LabAcceptOrderRequest {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RequestLabOrder)
  requestLab: RequestLabOrder;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: "Laboratory must accept atleast 1 prescription" })
  @Type(() => OrderedElectronicPrescriptions)
  prescriptions: OrderedElectronicPrescriptions[];

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => OrderSummary)
  order_summary: OrderSummary;
}
export class LabDeclineOrderRequest {
  @IsNotEmpty({ message: "RequestLabID is required" })
  @IsNumber()
  @IsPositive()
  request_lab_id: number;
}