import {
    MinLength,
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNotEmpty,
    IsPositive,
    IsNumber,
    IsIn
} from "class-validator";
import { Type } from "class-transformer";

export class adminRolePermissionSearch {
    @IsPositive()
    limit: number = 15;

    @IsNumber()
    offset: number = 0;

    @IsOptional()
    @MinLength(1, { message: "Please add alteast One characters" })
    @IsString()
    search: string;

    @IsOptional()
    sort: string;

    @IsOptional()
    @IsIn(["asc", "desc", "ASC", "DESC"])
    order: string;

    @IsOptional()
    @IsNumber()
    role_id: number;
}

export class Permission {

    @IsNotEmpty()
    @IsString()
    permission_name: string;

    @IsNotEmpty()
    permission_id: number;
}

export class adminRolePermissionAdd {
    @IsNotEmpty()
    @IsString()
    role_name: string;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Permission)
    permissions: Permission[];
}

export class adminRolePermissionEdit {
    @IsNotEmpty()
    @IsString()
    role_name: string;
    @IsNotEmpty()
    @IsPositive()
    role_id: number;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Permission)
    permissions: Permission[];
}
