import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsMobilePhone,
  IsNumber,
  IsDefined,
  Matches,
  IsPositive,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
  IsString,
  IsDataURI,
  IsDateString,
  IsDate,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
  IsOptional,
  ValidateIf,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import {
  AddressDetails,
  EditAddressDetails,
  OptionalEditAddressDetails,
} from "./address.validations";

class User {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
class DoctorInfo {
  @IsString()
  @IsNotEmpty({ message: "birth date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
    message: "Date Format must be in YYYY-MM-DD format",
  })
  birth_date: string;

  @IsString()
  @IsNotEmpty({ message: "Gender can't be empty" })
  gender: string;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => User)
  user: User;

  @IsNumber()
  experience: number;

  email: string;
}
class ProfessionalDetails {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => DoctorInfo)
  drInfo: DoctorInfo;

  @IsArray()
  @ArrayMinSize(1)
  specialites: number[];
}

class MedicalRegistrar {
  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @IsNumber()
  @IsNotEmpty()
  registration_year: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  council_id: number;
}

class EducationDetails {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  qualification_id: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  university_id: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  year: number;
}

class EducationQualification {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => MedicalRegistrar)
  mrdData: MedicalRegistrar;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EducationDetails)
  educationDetails: EducationDetails[];
}

class Workplace {
  @IsString()
  @IsNotEmpty()
  workplace_name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Max(60)
  time_per_appointment: number;

  @IsNotEmpty()
  @IsNumber()
  consultation_fee: number;
}

class Schedule {

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ])
  day: string;

  @IsNotEmpty()
  @IsString()
  start_time: string;

  @IsNotEmpty()
  @IsString()
  end_time: string;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  slot_available: number;
}

class WorkPlaceObj {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Workplace)
  workplace: Workplace;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDetails)
  address: AddressDetails;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Schedule)
  schedule: [Schedule];
}
class WorkplaceDetails {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => WorkPlaceObj)
  workplaces: WorkPlaceObj[];
}

class Conventions {
  @IsNotEmpty()
  @IsString()
  medical_convention: string;

  @IsNotEmpty()
  @IsNumber()
  prescription_limit: number;

  @IsNotEmpty()
  @IsString()
  prescription_days_week_month: string;
}

class Document {
  @IsNotEmpty()
  @IsString()
  number: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
class Features {
  @IsNumber()
  @IsIn([0, 1])
  video_call: number;

  @IsNumber()
  @IsIn([0, 1])
  audio_call: number;

  @IsNumber()
  @IsIn([0, 1])
  physical_examination: number;
}
class ProfileDetails {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Conventions)
  conventionDetails: Conventions;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Document)
  documentDetails: Document;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Features)
  features: Features;
}

export class DoctorSetUpProfile {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ProfessionalDetails)
  professionalInformation: ProfessionalDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EducationQualification)
  educationalQualification: EducationQualification;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkplaceDetails)
  workplaceInformation: WorkplaceDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileDetails)
  otherInformation: ProfileDetails;

  @IsNotEmpty({ message: "user role is required" })
  @IsNumber()
  @IsPositive({ message: "user role must be valid" })
  user_role: number;
}

class EditDoctorInfo {
  @IsString()
  @IsNotEmpty({ message: "birth date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
    message: "Date Format must be in YYYY-MM-DD format",
  })
  birth_date: string;

  @IsString()
  @IsNotEmpty({ message: "Gender can't be empty" })
  gender: string;

  @IsNumber()
  experience: number;

  email: string;
}

class EditProfessionalDetails {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditDoctorInfo)
  drInfo: EditDoctorInfo;

  @IsArray()
  @ArrayMinSize(1)
  specialites: number[];
}

class EditWorkplace extends Workplace {
  @IsOptional()
  @IsNotEmpty({ message: "WorkplaceID is required" })
  @IsNumber()
  @IsPositive()
  workplace_id: number;
}

class EditWorkPlaceObj {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditWorkplace)
  workplace: EditWorkplace;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => OptionalEditAddressDetails)
  address: OptionalEditAddressDetails;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Schedule)
  schedule: [Schedule];
}

class EditWorkplaceDetails {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => EditWorkPlaceObj)
  workplaces: EditWorkPlaceObj[];
}
export class EditDoctorSetUpProfile {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditProfessionalDetails)
  professionalInformation: EditProfessionalDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EducationQualification)
  educationalQualification: EducationQualification;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => EditWorkplaceDetails)
  workplaceInformation: EditWorkplaceDetails;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileDetails)
  otherInformation: ProfileDetails;

  @IsNotEmpty({ message: "user role is required" })
  @IsNumber()
  @IsPositive({ message: "user role must be valid" })
  user_role: number;
}

export class AddDelegates {
  @IsNotEmpty({ message: "staff_id can't be empty" })
  @IsNumber()
  @IsPositive()
  staff_id: number;

  @IsNotEmpty({ message: "workplaces_id can't be empty" })
  @IsNumber()
  @IsPositive()
  workplaces_id: number;

  @IsNotEmpty({ message: "manageAppoinment can't be empty" })
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  manageAppoinment: number;

  @IsNotEmpty({ message: "blockUnblockSchedue can't be empty" })
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  blockUnblockSchedue: number;

  @IsNotEmpty({ message: "changeSchedule can't be empty" })
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  changeSchedule: number;

  @IsOptional()
  doctor_id: number
}

export class DateObject {
  @IsNotEmpty({ message: "appointment date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
    message: "Date Format must be in YYYY-MM-DD format",
  })
  date: string;

  @IsNotEmpty({ message: "appointment day can't be empty" })
  @IsIn([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ])
  day: string;
}

export class DoctorSchedules extends DateObject {
  @IsOptional()
  doctor_id: number;
}

export class EditDelegates extends AddDelegates { }

export class RemoveDelegates {
  @IsNotEmpty({ message: "staff_id can't be empty" })
  @IsNumber()
  @IsPositive()
  staff_id: number;

  @IsNotEmpty({ message: "workplaces_id can't be empty" })
  @IsNumber()
  @IsPositive()
  workplaces_id: number;

  @IsOptional()
  doctor_id: number
}

class Slots {
  @IsNotEmpty()
  @IsString()
  from_time: string;

  @IsNotEmpty()
  @IsString()
  end_time: string;
}

// class ScheduleObject {
//   @IsNotEmpty()
//   @IsNumber()
//   id: number;

//   @IsNotEmpty()
//   @IsNumber()
//   workplace_id: number;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @ArrayMinSize(1)
//   @Type(() => Slots)
//   time_slots: Slots[];
// }

// class Slots {
//   @IsNotEmpty()
//   @IsString()
//   from_time: string;

//   @IsNotEmpty()
//   @IsString()
//   end_time: string;
// }

class ScheduleObject {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsNumber()
  workplace_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Slots)
  time_slots: Slots[];
}

export class BlockDoctorSchedule {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DateObject)
  blocked_dates: DateObject[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ScheduleObject)
  schedules: ScheduleObject[];

  @IsNotEmpty({ message: "Please provide slot type" })
  @IsIn(["slots", "schedule"])
  type: string;

  @IsOptional()
  @IsString()
  block_reason: String;
}

export class UnBlockDoctorSchedule {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DateObject)
  dates: DateObject[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ScheduleObject)
  schedules: ScheduleObject[];

  @IsNotEmpty({ message: "Please provide slot type" })
  @IsIn(["slots", "schedule"])
  type: string;
}

export class CancelAppointment {
  @IsNotEmpty({ message: "bookingID can't be empty" })
  @IsNumber()
  @IsPositive()
  bookingID: number;

  // @IsOptional()
  @IsNotEmpty({ message: "reason can't be empty" })
  @IsString()
  reason: string;
}

class Vitals {
 
  blood_pressure: string;

 
  heart_rate: number;

 
  height: number;

 
  weight: number;


  temp: string;
}

class RxMedicine {
  @IsNotEmpty({ message: "MedicineId can't be empty" })
  @IsNumber()
  @IsPositive()
  medicine_id: number;

  @IsNotEmpty({ message: "Substitue name can't be empty" })
  @IsString()
  medicine_name: string;

  @IsNotEmpty({ message: "Strength can't be empty" })
  @IsString()
  strength: string;

  @IsNotEmpty({ message: "Frequency can't be empty" })
  @IsString()
  frequency: string;

  @IsNotEmpty({ message: "Duration can't be empty" })
  @IsString()
  duration: string;

  @IsNotEmpty({ message: "Instructions can't be empty" })
  @IsString()
  instructions: string;

  @IsNotEmpty({ message: "Method of Use can't be empty" })
  @IsString()
  method_of_use: string;

  @IsNumber()
  @IsIn([0, 1])
  immunisation: number;

  @IsIn([0, 1], { message: "IsRepeatable Medicine values is in range of 0 or 1" })
  is_repeatable_medicine: number;

  @IsNumber()
  @IsNotEmpty({ message: "Repeat after can't be empty" })
  repeat_after: number;

  @IsNotEmpty({ message: "Repeat after type can't be empty" })
  @IsString()
  @IsIn(['Days', 'Week', 'Month'])
  repeat_after_type: string;
}

class PrescribedTest {
  @IsNotEmpty({ message: "TestId can't be empty" })
  @IsNumber()
  @IsPositive()
  test_id: number;

  @IsNotEmpty({ message: "Test Name can't be empty" })
  test_name: string;

  details: string;
}

class Refferals {
  doctor_id: number;
  workplace_id: number;
  workplaceName: string;
  
  @ValidateIf((o) => o.doctor_id === '')
  @IsNotEmpty({ message: "Refferal Name can't be empty" })
  referral_name: string;

  @ValidateIf((o) => o.doctor_id === '')
  @IsNotEmpty({ message: "Speciality can't be empty" })
  speciality: string;
}
export class Prescription {
  @IsNotEmpty({ message: "bookingID can't be empty" })
  @IsNumber()
  @IsPositive()
  booking_id: number;

  diagnosis: string;
  comments: string;

  @IsNotEmpty({ message: "followUp Duration can't be empty" })
  @IsNumber()
  followUpDuration: number;

  @IsNotEmpty({ message: "followUp Duration Type can't be empty" })
  @IsString()
  @IsIn(['Days', 'Week', 'Month'])
  followUpDurationType: string;

  @IsIn([0, 1], { message: "IsRepeatable Prescriptions values is in range of 0 or 1" })
  is_repeatable_prescriptions: number;

  
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Vitals)
  vitals: Vitals;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RxMedicine)
  rxMedicine: RxMedicine[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescribedTest)
  prescribedTest: PrescribedTest[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Refferals)
  refferals: Refferals[];

}

export class GetBookingDetails {
  @IsNotEmpty()
  @IsPositive()
  booking_id: number;

  @IsPositive()
  limit: number = 10;

  @IsNumber()
  offset: number = 0;
}
export class DoctorPatients {
  @IsPositive()
  limit: number = 10;

  @IsNumber()
  offset: number = 0;

  @IsOptional()
  @MinLength(1, { message: "Please add alteast One characters" })
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
    message: "Date Format must be in YYYY-MM-DD format",
  })
  date: string;
}

class ParentUserEntry {
  @IsNumber()
  @IsIn([0, 1])
  isnewuser: number;

  @ValidateIf((o) => o.isnewuser === 0)
  @IsNotEmpty({message: "Parent User ID reqiured if adding Existing user"})
  @IsPositive()
  id: number;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "First Name can't be empty" })
  first_name: string;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "Last Name can't be empty" })
  last_name: string;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "Gender can't be empty" })
  gender: string;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "Birth date can't be empty" })
  birth_date: string;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "Contact number can't be empty" })
	@IsMobilePhone(null, { strictMode: true }, { message: "Please provide valid country code" })
  contact_number: string;
}

class UserDetailsEntry {
  @IsNumber()
  @IsIn([0, 1])
  isnewminoruser: number;

  @ValidateIf((o) => o.isnewminoruser === 0)
  @IsNotEmpty({message: "Minor User ID reqiured if adding Existing user"})
  @IsPositive()
  id: number;

  @ValidateIf((o) => o.isnewminoruser === 1)
  @IsString()
	@IsNotEmpty({ message: "Minor First Name can't be empty" })
  first_name: string;

  @ValidateIf((o) => o.isnewminoruser === 1)
  @IsString()
	@IsNotEmpty({ message: "Minor Last Name can't be empty" })
  last_name: string;

  @ValidateIf((o) => o.isnewuser === 1)
  @IsString()
	@IsNotEmpty({ message: "Minor Gender can't be empty" })
  gender: string;

  @ValidateIf((o) => o.isnewminoruser === 1)
  @IsString()
	@IsNotEmpty({ message: "Minor Birth date can't be empty" })
  birth_date: string;
}
class OfflineEntryTime {
  @IsNotEmpty({ message: "appointment date can't be empty" })
  @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
    message: "Date Format must be in YYYY-MM-DD format",
  })
  date: string;

  @IsNotEmpty({ message: "appointment Start time required" })
  @IsString()
  start_time: string;

  @IsNotEmpty({ message: "appointment End time required" })
  @IsString()
  end_time: string;
}
export class OfflinePrecription {
  @IsNotEmpty({message: "Workplace ID is required"})
  @IsPositive()
  workplace_id: number;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ParentUserEntry)
  parent_user: ParentUserEntry;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => UserDetailsEntry)
  user_details: UserDetailsEntry;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => OfflineEntryTime)
  offline_pateint_entry_time: OfflineEntryTime;
}