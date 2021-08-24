import { ArrayMinSize, IsArray, IsEmail, IsIn, IsLatitude, IsLongitude, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsPositive, IsString, Matches, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { DateObject } from "./doctorProfile.validations";
import {
    BlockDoctorSchedule,
    UnBlockDoctorSchedule
} from "./doctorProfile.validations";

class Workplace {
    @IsNotEmpty()
    @IsString()
    workplace_name: string;
    address: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    pin_code: string;
    locality: string;

    @IsNotEmpty()
    @IsLatitude()
    @IsNumber()
    latitude: number;


    @IsNotEmpty()
    @IsLongitude()
    @IsNumber()
    longitude: number;

    @IsOptional()
    @IsString()
    @IsIn(['Pharmacy', 'Laboratory', 'Hospital', ""])
    workplace: string;
}

class Document {
    @IsNotEmpty()
    @IsString()
    number: string;

    @IsNotEmpty()
    @IsString()
    type: string;
}

class StaffInformation {

    @IsString()
    @IsNotEmpty({ message: "birth date can't be empty" })
    @Matches(/(\d{4})-(\d{2})-(\d{2})/, { message: "Date Format must be in YYYY-MM-DD format" })
    birth_date: string

    @IsNotEmpty()
    @IsString()
    gender: string

    @IsEmail()
    email: string

    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    id: number
}

export class StaffProfile {

    @IsNumber({}, { each: true })
    @ArrayMinSize(1)
    workplaceInfo: number[];


    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Document)
    documentDetails: Document;

    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => StaffInformation)
    staffDetails: StaffInformation;
}

class EditWorkPlace extends Workplace {

    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    workplace_id: number;

    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    address_id: number;
}

export class EditStaffProfile {
    @IsNumber({}, { each: true })
    @ArrayMinSize(1)
    workplaceInfo: number[];


    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Document)
    documentDetails: Document;

    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => StaffInformation)
    staffDetails: StaffInformation;
}

export class DoctorStaffSchedules extends DateObject {
    @IsNotEmpty({ message: "doctor_id can't be empty" })
    @IsNumber()
    @IsPositive()
    doctor_id: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    user_id: number;
}

export class DoctorStaffBlockDoctorSchedule extends BlockDoctorSchedule {
    @IsNotEmpty({ message: "Doctor Id is required" })
    @IsNumber()
    @IsPositive()
    doctor_id: number;
}


export class DoctorStaffUnBlockDoctorSchedule extends UnBlockDoctorSchedule {
    @IsNotEmpty({ message: "Doctor Id is required" })
    @IsNumber()
    @IsPositive()
    doctor_id: number;
}


class ScheduleChanged {
    @IsNotEmpty({ message: "Slot Id is required" })
    @IsNumber()
    @IsPositive()
    id: number;

    @IsNotEmpty({ message: "Day is required" })
    @IsString()
    day: string;

    @IsNotEmpty({ message: "Start Time is required" })
    @IsString()
    start_time: string;

    @IsNotEmpty({ message: "End Time is required" })
    @IsString()
    end_time: string;

    @IsNotEmpty()
	@IsIn([0, 1])
    slot_available: number;
}

class ScheduleAdded {
    @IsNotEmpty({ message: "Day is required" })
    @IsString()
    day: string;

    @IsNotEmpty({ message: "Start Time is required" })
    @IsString()
    start_time: string;

    @IsNotEmpty({ message: "End Time is required" })
    @IsString()
    end_time: string;
}

class BookingCancelled {
    @IsNotEmpty({ message: "Booking Id is required" })
    @IsNumber()
    @IsPositive()
    booking_id: number;

    @IsNotEmpty({ message: "reason can't be empty" })
    @IsString()
    reason: string;
}
export class ChangeSchedule {
    @IsNotEmpty({ message: "Doctor Id is required" })
    @IsNumber()
    @IsPositive()
    doctor_id: number;

    @IsNotEmpty({ message: "Workplace Id is required" })
    @IsNumber()
    @IsPositive()
    workplace_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(0)
    @Type(() => ScheduleChanged)
    schedules_changed: ScheduleChanged[];

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(0)
    @Type(() => ScheduleAdded)
    schedules_added: ScheduleAdded[];

    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(0)
    @Type(() => BookingCancelled)
    bookings_cancelled: BookingCancelled[];
}