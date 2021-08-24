import { Type } from "class-transformer";
import { IsPhoneNumber, IsNotEmpty, MinLength, IsMobilePhone, IsNumber, IsDefined, Matches, isPositive, IsPositive, IsString, ValidateNested, IsObject, IsNotEmptyObject, Min, IsInt, IsLatitude, IsLongitude, IsIn, ArrayMinSize, IsArray, IsOptional, IsBoolean, ValidateIf } from "class-validator";

export class LinkDetails {
    @IsNotEmpty({ message: "manage_their_account can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_their_account: number;

    @IsNotEmpty({ message: "manage_your_account can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_your_account: number;

    @IsNotEmpty({ message: "manage_their_medical_history can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_their_medical_history: number;

    @IsNotEmpty({ message: "manage_your_medical_history can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_your_medical_history: number;

    @IsNotEmpty({ message: "manage_their_minor_account can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_their_minor_account: number;

    @IsNotEmpty({ message: "manage_your_minor_account can't be empty" })
    @IsNumber()
    @IsIn([0, 1], { message: "Please add values in range of 0 or 1" })
    manage_your_minor_account: number;


    @IsOptional()
    @IsNumber()
    @IsPositive()
    linked_id: number;
}

export class MultipaleLinkDetails {
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => LinkDetails)
    permissions: LinkDetails[];

    @IsNotEmpty({ message: "Please select patient" })
    @IsNumber()
    @IsPositive()
    patient_id: number;
}


export class AddLinkAccount extends LinkDetails {
    @IsPhoneNumber(null)
    @IsNotEmpty()
    phone_number: string;
}

export class ListLinkAccount {
    @IsNotEmpty({ message: "Please select action" })
    @IsIn(['All', 'Pending', 'ActionTaken', 'Accepted', 'Rejected'])
    listType: string;
}

export class LinkAccount {
    @IsNotEmpty({ message: "Please select link, on which action to be performed" })
    @IsNumber()
    @IsPositive()
    link_id: number;
}

export class LinkAction extends LinkAccount {
    @IsNotEmpty({ message: "Please select the action." })
    @IsIn([1, 2, 3]) // 1- Accepted, 2- Declined, 3- Cancelled
    linkAction: string;
}