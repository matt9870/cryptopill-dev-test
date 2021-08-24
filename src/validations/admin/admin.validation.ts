// import { IsBoolean, isEmail, IsEmail, IsMobilePhone, isNotEmpty, IsNotEmpty, IsPhoneNumber } from "class-validator";
import { IsEmail, IsNotEmpty, IsMobilePhone, IsPhoneNumber, IsString, Matches, MinLength, MaxLength, IsPositive, IsNumber, IsOptional, IsIn } from 'class-validator'
export class LoginValidation {

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    password: string
    @IsNotEmpty()
    role_id: number
}


export class ForgotPasswordValidation {
    @IsEmail()
    @IsNotEmpty()
    email: string
    @IsPhoneNumber(null, { message: "Please provide valid countrycode" })
    @IsNotEmpty()
    contact_number: string
}

export class AdminSignup {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsPhoneNumber(null)
    contact_number: string
    @IsNotEmpty()
    first_name: string

    @IsNotEmpty()
    last_name: string
}

export class changeAccountStatusBody {
    @IsNotEmpty()
    user_role_id: number

    @IsNotEmpty()
    active_status: boolean
}

export class EditAdminDetails {
    @IsNotEmpty()
    first_name: string

    @IsNotEmpty()
    last_name: string

    @IsString()
    @IsNotEmpty({ message: "birth date can't be empty" })
    @Matches(/(\d{4})-(\d{2})-(\d{2})/, {
        message: "Date Format must be in YYYY-MM-DD format",
    })
    birth_date: string;
}

export class AdminAdd {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsPhoneNumber(null)
    contact_number: string
    @IsNotEmpty()
    first_name: string

    @IsNotEmpty()
    last_name: string

    @IsString()
    @IsNotEmpty({ message: "password can't be empty" })
    @MinLength(8, {
        message: "Minimum password length should be 8 characters"
    })
    @MaxLength(40, {
        message: "Maximum password length should be 40 characters"
    })
    password: string;

    // @IsString()
    // @IsNotEmpty({ message: "confirm_password can't be empty" })
    // @MinLength(8, {
    //     message: "Minimum password length should be 8 characters"
    // })
    // @MaxLength(40, {
    //     message: "Maximum password length should be 40 characters"
    // })
    // confirm_password: string;

    @IsNotEmpty()
    @IsPositive()
    role_id: number;

}


export class EditDetails {
    @IsNotEmpty()
    @IsPositive()
    admin_id: number;

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsPhoneNumber(null)
    contact_number: string
    @IsNotEmpty()
    first_name: string

    @IsNotEmpty()
    last_name: string


    @IsNotEmpty()
    @IsPositive()
    role_id: number;

}

export class listAdminByRole {
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
