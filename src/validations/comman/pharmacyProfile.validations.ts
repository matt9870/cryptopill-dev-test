import { IsEmail, IsNotEmpty, MinLength, IsMobilePhone, IsNumber, IsDefined, Matches, isPositive, IsPositive, IsString, ValidateNested, IsObject, IsNotEmptyObject, Min, IsInt, IsLatitude, IsLongitude, IsIn, ArrayMinSize, IsArray, IsOptional, IsBoolean, ValidateIf } from "class-validator";
import { Type } from 'class-transformer';
import { AddressDetails, EditAddressDetails } from "./address.validations";
import { AddEmployee, Employee } from "./users.validation";
import { PreviousOrder } from "./basicInfo.validations";

// class Location {   
//     @IsLatitude()
//     @IsNumber()
//     latitude: number;

//     @IsLongitude()
//     @IsNumber()
//     longitude: number;
// } 

// class AddressDetails {
//     @IsNotEmpty({ message: "Address is required" })
//     @IsString()
//     address: string;

//     @IsDefined()
//     @IsNotEmptyObject()
//     @IsObject()
//     @ValidateNested({each: true})
//     @Type(() => Location)
//     location: Location;

//     @IsString()
//     locality: string;

//     @IsString()
//     city: string;

//     @IsString()
//     pincode: string;
// }

class PharmacyProfile {
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => WorkplaceDetails)
    workplaces: WorkplaceDetails[];

    @IsNotEmpty({ message: "User id is required"})
    @IsNumber()
    user_id: number;
}

class PharmacyDeliveryProfile {

    @IsNumber()
    @IsNotEmpty()
    @IsIn([0, 1], {message: "Please add values in range of 0 or 1"})
    delivery_customer: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0, {message: "value cant be less than zero"})
    delivery_distance: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0, {message: "value cant be less than zero"})
    minimum_order_amount: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0, {message: "value cant be less than zero"})
    minimum_delivery_charges: number
    
    @IsNumber()
    @IsNotEmpty()
    @IsIn([0, 1], {message: "Please add values in range of 0 or 1"})
    additional_charges: number;
    
    @IsNumber()
    @IsNotEmpty()
    @Min(0, {message: "value cant be less than zero"})
    minimum_additional_charges: number
}

class Workplace extends PharmacyDeliveryProfile{
    @IsNotEmpty({ message: "Workplace name is required" })
    @IsString()
    workplace_name: string;
    
    @IsNotEmpty({ message: "Franchise case is required"})
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
    
    @IsNotEmpty({ message: "License number is required"})
    @IsString()
    license_number: string;
    
    @IsNotEmpty({ message: "GST number is required"})
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

export class PharmacySetUpProfile {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => PharmacyProfile)
    pharmacyDetails: PharmacyProfile;

    @IsNotEmpty({ message: "user role is required" })
    @IsNumber()
    @IsPositive({message: "user role must be valid"})
    user_role: number
}

 export class PharmacyEmployee extends Employee {
    @IsNumber()
	@IsNotEmpty({message: "Role Id can't be empty"})
	@IsPositive({message: "Not a valid Role Id"})
    role_id: number;

    @IsNotEmpty()
    @IsNumber()
    @IsIn([0, 1], {message: "Please add values in range of 0 or 1"})
    edit_profile: number; //does have access to edit lab profie
}

export class EditPharmacyEmployee extends PharmacyEmployee{
    
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    id: number;

}

class EditWorkplace extends Workplace {
    @IsNotEmpty({ message: "WorkplaceID is required"})
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
    @ArrayMinSize(1, {message: "There must be atleast one employee in a Pharmacy"})
    @Type(() => AddEmployee)
    employees: AddEmployee[];
}
 class EditPharmacyProfile {
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => EditWorkplaceDetails)
    workplaces: EditWorkplaceDetails[];
}

export class EditPharmacySetUpProfile {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => EditPharmacyProfile)
    pharmacyDetails: EditPharmacyProfile;

    @IsNotEmpty({ message: "user role is required" })
    @IsNumber()
    @IsPositive({message: "user role must be valid"})
    user_role: number
}

export class EditPharmacyUserProfile {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @Type(() => Employee)
    personal_information: Employee;
}

export class PharmacyOrders {
    @IsPositive()
    limit: number = 10;
  
    @IsNumber()
    offset: number = 0;
}

export class PharmacyPastOrders extends PharmacyOrders {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: "birth date can't be empty" })
    @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
        message: "Date Format must be in YYYY-MM-DD format",
    })
    date: string
}

class RequestPharmacy {
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

class RxMedicines {
    @IsNotEmpty({ message: "medicineID is required" })
    @IsNumber()
    @IsPositive()
    medicine_id: number;

    @IsNotEmpty({ message: "medicineName is required" })
    @IsString()
    medicine_name: string;

    @IsNotEmpty({ message: "medicineStrength is required" })
    @IsString()
    strength: string;

    @IsNotEmpty({ message: "duration is required" })
    @IsString()
    duration: string;

    @IsNotEmpty({ message: "frequency is required" })
    @IsString()
    frequency: string;

    @IsNotEmpty({ message: "Instructions is required" })
    @IsString()
    instructions: string;

    @IsIn([0, 1])
    immunisation: number;

    @IsNotEmpty({ message: "methodofUse is required" })
    @IsString()
    method_of_use: string;

    @IsIn([0, 1])
    is_repeatable_medicine: number;

    @IsNotEmpty({ message: "RepeatAfter is required" })
    @IsNumber()
    repeat_after: number;

    @IsNotEmpty({ message: "RepeatAfterType is required" })
    @IsString()
    repeat_after_type: string;

    @IsNotEmpty({ message: "AcceptedRisk is required" })
    @IsBoolean()
    accepted_risk: boolean;

    @IsNotEmpty({ message: "DrugUnit is required" })
    @IsString()
    drug_unit: string;

    @IsNotEmpty({ message: "Packaging is required" })
    @IsString()
    packaging: string;

    @IsNotEmpty({ message: "MRP is required" })
    @IsNumber()
    mrp: number;
}
class ElectronicPrescriptions {
    @IsNotEmpty({ message: "prescriptionID is required" })
    @IsNumber()
    @IsPositive()
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
    @ArrayMinSize(1, { message: "There must be atleast one medicine in a Prescription" })
    @Type(() => RxMedicines)
    medicines: RxMedicines[];
}
export class PharmacyOrderRequest {
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
    @Type(() => RequestPharmacy)
    requestPharmacy: RequestPharmacy;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: "Patient must add atleast 1 prescription" })
    @Type(() => ElectronicPrescriptions)
    prescriptions: ElectronicPrescriptions[];
}

class PharmamacyPreviousOrder extends PreviousOrder { };
export class ReOrderPharmacyRequest {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @Type(() => PharmamacyPreviousOrder)
    previous_order_details: PharmamacyPreviousOrder;

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => RequestPharmacy)
    requestPharmacy: RequestPharmacy;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: "Patient must add atleast 1 prescription" })
    @Type(() => ElectronicPrescriptions)
    prescriptions: ElectronicPrescriptions[];
}

export class PharmacyCancelOrder {
    @IsNotEmpty({ message: "OrderId is required" })
    @IsString()
    order_id: string;

    @IsNotEmpty({ message: "PharmacyID is required" })
    @IsNumber()
    @IsPositive()
    pharmacy_id: number;

    @IsNotEmpty({ message: "Cancellation Reason is Required" })
    @IsString()
    cancel_reason: string;

    @IsNotEmpty({ message: "OrderRequestPharmacyID is required" })
    @IsNumber()
    @IsPositive()
    order_request_pharmacy_id: number;
}

export class PharmacyMarkOrderAsDelivered {
    @IsNotEmpty({ message: "OrderRequestPharmacyID is required" })
    @IsNumber()
    @IsPositive()
    order_request_pharmacy_id: number;
}

class RequestPharmacyOrder {
    @IsNotEmpty({ message: "RequestPharmacyID is required" })
    @IsNumber()
    @IsPositive()
    request_pharmacy_id: number;

    @IsIn([0, 1])
    full_order: number;

    @IsIn([0, 1])
    partial_order: number;

    @IsIn([0, 1])
    substituted_medicines: number;
}
class RxSubstitue extends RxMedicines {}
class OrderedRxMedicines {
    @IsNotEmpty({ message: "MedicineID is required" })
    @IsNumber()
    @IsPositive()
    medicine_id: number;

    @IsIn([0, 1])
    is_pharmacy_selected: number;

    @IsOptional()
    @IsIn([0, 1])
    is_substituted: number;

    @ValidateIf((o) => o.is_substituted === 1)
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => RxSubstitue)
    substituted: RxSubstitue;
}
class OrderedElectronicPrescriptions {
    @IsNotEmpty({ message: "PrescribeOrderID is required" })
    @IsNumber()
    @IsPositive()
    prescribed_order_id: number;

    @IsNotEmpty({ message: "PrescriptionID is required" })
    @IsNumber()
    @IsPositive()
    prescriptions_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: "Pharmacy Order must have atleast 1 medicine" })
    @Type(() => OrderedRxMedicines)
    medicines: OrderedRxMedicines; 
}

class OrderSummary {
    @IsIn([0, 1])
    home_delivery: number;

    @IsNotEmpty({ message: "Medicine Price is required" })
    @IsNumber()
    selected_medicines_price: number;
    
    @IsNotEmpty({ message: "Total is required" })
    @IsNumber()
    total: number;
}
export class PharmacyAcceptOrderRequest {
    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => RequestPharmacyOrder)
    requestPharmacy: RequestPharmacyOrder;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: "Pharmacy must accept atleast 1 prescription" })
    @Type(() => OrderedElectronicPrescriptions)
    prescriptions: OrderedElectronicPrescriptions[];

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => OrderSummary)
    order_summary: OrderSummary;
}
export class PharmacyDeclineOrderRequest {
    @IsNotEmpty({ message: "RequestPharmacyID is required" })
    @IsNumber()
    @IsPositive()
    request_pharmacy_id: number;
}