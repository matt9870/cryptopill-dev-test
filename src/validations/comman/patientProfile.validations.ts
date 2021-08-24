import {
	IsEmail,
	IsNotEmpty,
	IsNumber,
	IsDefined,
	Matches,
	IsPositive,
	IsString,
	ValidateNested,
	IsObject,
	IsNotEmptyObject,
	IsLatitude,
	IsLongitude,
	IsIn,
	IsEmpty,
	IsOptional,
	ValidateIf,
	IsArray,
	ArrayMinSize,
	MinLength,
	IsMobilePhone,
	MaxLength,
	IsBoolean
} from "class-validator";
import { Type } from "class-transformer";

import { EditAddressDetails } from "./address.validations";
import { Float } from "aws-sdk/clients/ec2";

export class PatientProfile {
	id: number;

	@IsString()
	@IsNotEmpty({ message: "First name can't be empty" })
	first_name: string;

	@IsString()
	@IsNotEmpty({ message: "birth date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	birth_date: string;

	@IsString()
	@IsNotEmpty({ message: "Gender can't be empty" })
	gender: string;

	// @IsString()
	// @IsNotEmpty({message: "Password can't be empty"})
	password: string;

	@IsString()
	@IsNotEmpty({ message: "Last name can't be empty" })
	last_name: string;

	@IsString()
	blood_group: string;

	@IsString()
	@IsNotEmpty({ message: "Locality can't be empty" })
	locality: string;

	@IsString()
	@IsNotEmpty({ message: "City name can't be empty" })
	city: string;

	@IsString()
	@IsNotEmpty({ message: "Society name can't be empty" })
	society: string;
	pincode: string;

	@IsString()
	@IsNotEmpty({ message: "Emergency First name can't be empty" })
	emergency_first_name: string;

	@IsString()
	@IsNotEmpty({ message: "Emergency Last name can't be empty" })
	emergency_last_name: string;

	// TODO: temp comment
	// @IsString()
	// @IsNotEmpty({message: "Contact number can't be empty"})
	// @IsMobilePhone(null, {
	//     strictMode: true
	// }, { message: "Please provide valid countrycode" })
	emergency_contact_number: string;

	// @IsString()
	// @IsNotEmpty({message: "Contact number can't be empty"})
	// @IsMobilePhone(null, {
	//     strictMode: true
	// }, { message: "Please provide valid countrycode" })
	contact_number: string;

	// @IsEmail()
	email: string;

	// @IsNotEmpty()
	document_type: string;

	// @IsNotEmpty()
	document_number: string;

	@IsLatitude()
	@IsNumber()
	latitude: number;

	@IsLongitude()
	@IsNumber()
	longitude: number;

	// @IsNumber()
	// @IsNotEmpty({message: "Role Id can't be empty"})
	// @IsPositive({message: "Not a valid Role Id"})
	role_id: number;
}

class EditPatientInfo {
	@IsEmail()
	email: string;

	@IsString()
	@IsNotEmpty({ message: "birth date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	birth_date: string;

	@IsString()
	@IsNotEmpty({ message: "Gender can't be empty" })
	gender: string;

	@IsNotEmpty()
	@IsString()
	document_type: string;

	@IsNotEmpty()
	@IsString()
	document_number: string;
}

class EditEmergencyInfo {
	@IsString()
	@IsNotEmpty({ message: "Emergency First name can't be empty" })
	first_name: string;

	@IsString()
	@IsNotEmpty({ message: "Emergency Last name can't be empty" })
	last_name: string;

	contact_number: string;
}

export class EditPatientProfile {
	@IsDefined()
	@IsNotEmptyObject()
	@IsObject()
	@Type(() => EditPatientInfo)
	personal_information: EditPatientInfo;

	@IsDefined()
	@IsNotEmptyObject()
	@IsObject()
	@ValidateNested()
	@Type(() => EditAddressDetails)
	address_information: EditAddressDetails;

	@IsDefined()
	@IsNotEmptyObject()
	@IsObject()
	@Type(() => EditEmergencyInfo)
	emergency_contact: EditEmergencyInfo;
}

export class BookAppointment {
	@IsNotEmpty({ message: "doctor id is required" })
	@IsNumber()
	@IsPositive()
	doctor_id: number;

	patient_id: number;

	@IsNotEmpty({ message: "workplace id is required" })
	@IsNumber()
	@IsPositive()
	workplace_id: number;

	@IsString()
	@IsNotEmpty({ message: "appointment date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	date: string;

	@IsNotEmpty({ message: "start time can't be empty" })
	@IsString()
	@Matches(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/, {
		message: "Time format must be in HH:MM:SS format",
	})
	start_time: string;

	@IsNotEmpty({ message: "end time can't be empty" })
	@IsString()
	@Matches(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/, {
		message: "Time format must be in HH:MM:SS format",
	})
	end_time: string;

	@IsNotEmpty({ message: "schedule id is required" })
	@IsNumber()
	@IsPositive()
	schedule_id: number;

	@IsIn([0, 1])
	video_call: number = 0;

	@IsIn([0, 1])
	audio_call: number = 0;

	@IsIn([0, 1])
	physical_examination: number = 0;

	@IsIn([0, 1])
	medical_history_shared: number = 0;
}

class DateObj {
	@IsString()
	@IsNotEmpty({ message: "date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	date: string;

	@IsString()
	@IsNotEmpty({ message: "Day can't be empty" })
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
}
export class NearBySearch {
	@IsOptional()
	@IsPositive()
	patient_id: number;

	@IsNotEmpty({ message: "Latitude can't be empty" })
	@IsLatitude()
	latitude: number;

	@IsNotEmpty({ message: "Longitude can't be empty" })
	@IsLongitude()
	longitude: number;

	@IsOptional()
	@IsNotEmpty({ message: "Search Radius can't be empty" })
	@IsPositive({ message: "Search Radius must be greater than zero" })
	searchRadius: number;

	@IsPositive()
	limit: number = 10;

	@IsNumber()
	offset: number = 0;

	@IsOptional()
	@IsIn(["gender", "availability", "medical_convention"])
	filter_type: string;

	@IsOptional()
	@IsIn([
		"consultation_fee",
		"experience",
		"distance",
		"availability",
		"rating",
	])
	sort_type: string;

	@ValidateIf((o) => o.filter_type === "gender")
	@IsIn(["male", "female", "other"])
	gender: string;

	@ValidateIf((o) => o.filter_type === "availability")
	@IsArray()
	@ValidateNested({ each: true })
	@ArrayMinSize(1)
	@Type(() => DateObj)
	dates: DateObj[];

	@ValidateIf((o) => o.filter_type === "medical_convention")
	@IsNotEmpty({ message: "Medical Convention can't be empty" })
	medical_convention: string;

	@ValidateIf((o) => o.sort_type != undefined)
	@IsIn(["asc", "desc"])
	sort: string;

	@IsOptional()
	@IsArray()
	@ArrayMinSize(1)
	specialities: string[];

	@IsOptional()
	@IsArray()
	@ArrayMinSize(1)
	healthConcerns: string[];

	@IsOptional()
	@IsString()
	@MinLength(4, { message: "Please add alteast Four characters" })
	search: string;

	@IsOptional()
	@IsIn([0, 1])
	video_call: number;

	@IsOptional()
	@IsIn([0, 1])
	audio_call: number;
}

export class Allergies {
	@IsOptional()
	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	user_id: number;

	@IsArray()
	@ArrayMinSize(1)
	allergies: number[];

	otherAllergies: string[];
}

export class ReScheduleAppointment extends BookAppointment {
	@IsNotEmpty({ message: "bookingId can't be empty" })
	@IsNumber()
	@IsPositive()
	booking_id: number;

	// @IsOptional()
	@IsNotEmpty({ message: "reason can't be empty" })
	@IsString()
	reason: string;
}



export class MinorAccountValidation {

	@IsString()
	@IsNotEmpty({ message: "First name can't be empty" })
	first_name: string;

	@IsString()
	@IsNotEmpty({ message: "birth date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	birth_date: string;

	@IsString()
	@IsNotEmpty({ message: "Gender can't be empty" })
	gender: string;

	@IsString()
	@IsNotEmpty({ message: "Last name can't be empty" })
	last_name: string;

	@IsString()
	blood_group: string;

	@IsOptional()
	@IsString()
	document_type: string;

	@IsOptional()
	@IsString()
	document_number: string;
}

export class EditMinorAccountValidation {

	@IsNotEmpty()
	@IsPositive()
	minor_id: number;

	@IsString()
	@IsNotEmpty({ message: "First name can't be empty" })
	first_name: string;

	@IsString()
	@IsNotEmpty({ message: "birth date can't be empty" })
	@Matches(/(\d{4})-(\d{2})-(\d{2})/, {
		message: "Date Format must be in YYYY-MM-DD format",
	})
	birth_date: string;

	@IsString()
	@IsNotEmpty({ message: "Gender can't be empty" })
	gender: string;

	@IsString()
	@IsNotEmpty({ message: "Last name can't be empty" })
	last_name: string;

	@IsString()
	blood_group: string;

	@IsOptional()
	@IsString()
	document_type: string;

	@IsOptional()
	@IsString()
	document_number: string;

	@IsOptional()
	@IsBoolean()
	status: boolean;
}


export class MinorAllergies {
	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	minor_id: number;

	@IsArray()
	@ArrayMinSize(1)
	allergies: number[];

	otherAllergies: string[];
}


export class VerifyPhoneValidation {
	id: number;
	@IsNotEmpty({ message: "minor id is required" })
	@IsNumber()
	@IsPositive()
	minor_id: number;


	@IsString()
	@IsNotEmpty({ message: "Contact number can't be empty" })
	@IsMobilePhone(null, { strictMode: true }, { message: "Please provide valid country code" })
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

export class SetPassword {
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

export class RatingAndReview {
	@IsNotEmpty({ message: "DoctorID is required" })
	@IsNumber()
	@IsPositive()
	doctor_id: number;

	@IsIn([1, 2, 3, 4, 5])
	rating: number;

	@IsNotEmpty({ message: "Review cannot be Empty" })
	@IsString()
	review: string;
}

export class GetRatingAndReview {
	@IsNotEmpty({ message: "DoctorID is required" })
	@IsNumber()
	@IsPositive()
	doctor_id: number;

	@IsPositive()
	limit: number = 15;

	@IsNumber()
	offset: number = 0;
}