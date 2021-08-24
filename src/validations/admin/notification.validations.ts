import {
    MinLength,
    IsOptional,
    IsPositive,
    IsNumber,
    Matches,
    IsIn,
    IsNotEmpty,
    IsString
} from "class-validator";
// import { Type } from "class-transformer";

export class listNotification {
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

    @IsNotEmpty()
    @IsString()
    @IsIn(["Patient", "Doctor", "Staff", "PharmacyAdmin", "PharmacyEmployee", "LabAdmin", "LabEmployee"])
    role_type: string;
}

export class notificationEdit {
    @IsNotEmpty()
    @IsString()
    key: string;


    @IsNotEmpty()
    message: string

    @IsNotEmpty()
    @IsIn([0, 1])
    email_notification: number;

    @IsNotEmpty()
    @IsIn([0, 1])
    sms_notification: number;

    @IsNotEmpty()
    @IsIn([0, 1])
    push_notification: number;
}