import { IsNotEmpty } from "class-validator";

// mport { IsEmail, IsNotEmpty, MinLength } from "class-validator";
export class BasicInformation {
    @IsNotEmpty({ message: "First name is required" })
    first_name: string;

    @IsNotEmpty({ message: "Last name is required" })
    last_name: string;

    @IsNotEmpty({ message: "Mobile number is required" })
    contact_number: string;
}