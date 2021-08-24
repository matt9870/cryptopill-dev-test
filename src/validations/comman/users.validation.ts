import {
  IsEmail,
  IsIn,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from "class-validator";

export class Employee {
  @IsOptional()
  @IsNotEmpty({ message: "id can't be empty" })
  id: number;

  @IsString()
  @IsNotEmpty({ message: "First name can't be empty" })
  first_name: string;

  @IsOptional()
  @IsString()
  middle_name: string;

  @IsString()
  @IsNotEmpty({ message: "Last name can't be empty" })
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Contact number can't be empty" })
  @IsMobilePhone(
    null,
    {
      strictMode: true,
    },
    { message: "Please provide valid country code" }
  )
  contact_number: string;

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
  lab_or_pharma_employement_number: string;

  @IsNotEmpty()
  @IsString()
  document_type: string;

  @IsNotEmpty()
  @IsString()
  document_number: string;
}

export class AddEmployee extends Employee {
  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  edit_profile: number;
}

export class AddRecordingPermission {
  @IsNotEmpty({ message: "Booking Id can't be empty" })
  @IsPositive()
  booking_id: number;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  is_patient_recording: number;

  @IsOptional()
  @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
  is_doctor_recording: number;
}

export class CancelOrder {
  @IsNotEmpty({ message: "Order Id can't be empty" })
  @IsString()
  order_id: string;
}

export class AddRecordingRules {
  @IsNotEmpty({ message: "Room Id can't be empty" })
  @IsString()
  room_id: string;

  @IsNotEmpty({ message: "Booking Id can't be empty" })
  @IsPositive()
  booking_id: number;
}