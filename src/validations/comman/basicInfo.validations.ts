import { Type } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsMobilePhone,
  IsNumber,
  IsString,
  IsPositive,
  MaxLength,
  IsAlphanumeric,
  IsOptional,
  IsIn,
  ValidateIf,
  Matches,
  ValidateNested,
  IsArray,
} from "class-validator";
export class BasicInformation {
	id: number;
	@IsNotEmpty({ message: "First name is required" })
	first_name: string;

	@IsNotEmpty({ message: "Last name is required" })
	last_name: string;

	@IsMobilePhone(
		null,
		{ strictMode: true },
		{ message: "Please provide valid countryCode" }
	)
	contact_number: string;
}

export class OtpVerification {
	@IsMobilePhone(
		null,
		{ strictMode: true },
		{ message: "Please provide valid countryCode" }
	)
	ph_number: string;

	@IsNotEmpty({ message: "Otp is required" })
	otp: string;
}

export class PasswordUpdate {
	@IsNumber()
	@IsNotEmpty({ message: "User Id can't be empty" })
	@IsPositive({ message: "Not a valid User Id" })
	id: number;

	@IsString()
	@IsNotEmpty({ message: "Password can't be empty" })
	@MinLength(8, {
		message: "Minimum password length should be 8 characters"
	})
	@MaxLength(40, {
		message: "Maximum password length should be 40 characters"
	})
	password: string;
}

export class ResendOTP {
	@IsMobilePhone(
		null,
		{ strictMode: true },
		{ message: "Please provide valid countryCode" }
	)
	contact_number: string;
}
class AdminSearch {
  @IsPositive()
  limit: number = 15;

  @IsNumber()
  offset: number = 0;

  @IsOptional()
  @MinLength(1, { message: "Please add alteast One characters" })
  @Matches(/^[ A-Za-z0-9_@./#&+-]*$/, {
    message: "Invalid search string",
  })
  search: string;

  @IsOptional()
  sort: string;

  @IsOptional()
  @IsIn(["asc", "desc", "ASC", "DESC"])
  order: string;
}

export class AdminPatientSearch extends AdminSearch {
	@IsOptional()
	@IsIn(['All', 'Inactive', 'Verified', 'Unverified_new', 'Unverified_edit'])
	status: string;
	@IsOptional()
	user_id: number
}
export class AdminDashboardSearch extends AdminSearch {

	@IsOptional()
	@IsIn(['All', 'Verified', 'Unverified_new', 'Unverified_edit', 'Awaiting_approval', 'Approved'])
	status: string;

	@IsOptional()
	@IsIn(['All', 'Patient', 'Doctor', 'SupportStaff', 'Laboratory', 'Pharmacy', 'Allergies', 'Speciality'])
	type: string;
}

export class ChangePassword {
	@IsString()
	@IsNotEmpty({ message: "current_Password can't be empty" })
	@MinLength(8, {
		message: "Minimum password length should be 8 characters"
	})
	@MaxLength(40, {
		message: "Maximum password length should be 40 characters"
	})
	current_password: string;

	@IsString()
	@IsNotEmpty({ message: "new_password can't be empty" })
	@MinLength(8, {
		message: "Minimum password length should be 8 characters"
	})
	@MaxLength(40, {
		message: "Maximum password length should be 40 characters"
	})
	new_password: string;

	@IsString()
	@IsNotEmpty({ message: "confirm_new_password can't be empty" })
	@MinLength(8, {
		message: "Minimum password length should be 8 characters"
	})
	@MaxLength(40, {
		message: "Maximum password length should be 40 characters"
	})
	confirm_new_password: string;
}

export class AdminDoctorAndStaffSearch extends AdminPatientSearch {
	@IsOptional()
	@IsIn(['All', 'Doctor', 'SupportStaff'])
	type: string;
}
export class AdminPateintAppointmentSearch extends AdminSearch {
	@IsOptional()
	@IsIn(['All', 'Accepted', 'Completed', 'Cancelled_by_Doctor', 'Cancelled_by_Patient', 'Declined_by_Doctor', 'No_Response_From_Doctor_Yet', 'Timedout'])
	status: string;

	// @ValidateIf((o) => o.status === "Cancelled_by_Doctor")
	// @IsNotEmpty({message: "cancel_reason can't be empty pass 'any' if no reason available"})
	// cancel_reason: string;

	@IsOptional()
	@IsPositive()
	doctor_id: number

	@IsOptional()
	@IsPositive()
	patient_id: number
}

export class AdminPharmacistSearch extends AdminSearch {

	@IsOptional()
	@IsPositive()
	workplace_id: number;

	@IsOptional()
	user_id: number
	@IsOptional()
	@IsIn(['All', 'Verified', 'Unverified_new', 'Unverified_edit'])
	status: string;
	@IsOptional()
	workplace_name: string
	@IsOptional()
	franchise: string
}

export class PharmacyOrderSearch extends AdminSearch {

	@IsOptional()
	@IsPositive()
	pharmacy_user_id: number;

	@IsOptional()
	patient_id: number
	@IsOptional()
	// @IsIn(['All', 'Verified', 'Unverified_new', 'Unverified_edit'])
	status: number;
}

export class LabOrderSearch extends AdminSearch {

	@IsOptional()
	@IsPositive()
	lab_user_id: number;

	@IsOptional()
	patient_id: number
	@IsOptional()
	// @IsIn(['All', 'Verified', 'Unverified_new', 'Unverified_edit'])
	status: number;
}
export class AdminLabPharmacyUsersSearch extends AdminSearch {
  @IsOptional()
  @IsIn(["All", "Admin", "Employee"])
  type: string;

  @IsOptional()
	workplace_id: number;

	@IsOptional()
	user_id: number
}

export class Drug {
	source_name: string;
	
	@IsNotEmpty()
	@IsString()
	drug_name: string;
	
	@IsNotEmpty()
	@IsString()
	drug_manufacturer: string;
	
	@IsNotEmpty()
	@IsString()
	drug_unit: string;
	
	@IsNotEmpty()
	@IsString()
	packaging: string;
	
	@IsNotEmpty()
	@IsString()
	drug_salt: string;
	
	@IsNotEmpty()
	@IsString()
	strength: string;
	
	@IsNotEmpty()
	@IsString()
	drug_route: string;
	
	@IsNotEmpty()
	@IsPositive()
	mrp: number;
	
	@IsNotEmpty()
	@IsIn([0, 1])
	habit_forming: number; 
	
	@IsNotEmpty()
	@IsIn([0, 1])
    schedule_h: number;
	
	@IsNotEmpty()
	@IsString()
	administration_rules: string;
	
	@IsNotEmpty()
	@IsIn([0, 1])
	drug_status: number;
	
	@IsNotEmpty()
	@IsIn([0, 1])
	immunisation: number;
}

export class AddDrugs {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Drug)
	drugs: Drug[];
}

export class PreviousOrder {
	@IsNotEmpty({ message: "workplaceID is required"})
    @IsNumber()
    @IsPositive()
	workplace_id: number;

	@IsNotEmpty({ message: "userID is required"})
    @IsNumber()
    @IsPositive()
	user_id: number;
}

export class SwitchRole {
	@IsNotEmpty({ message: "roleID is required"})
    @IsNumber()
    @IsPositive()
	role_id: number;
}