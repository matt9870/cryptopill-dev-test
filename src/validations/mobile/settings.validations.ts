import {
    IsIn,
    IsNotEmpty,
} from "class-validator";
// import { Type } from "class-transformer";



export class SettingsEdit {
    @IsNotEmpty()
    // @IsIn([true, false])
    is_for_all: boolean;

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