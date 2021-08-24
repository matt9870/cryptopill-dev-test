import { Type } from "class-transformer";
import { IsDefined, IsLatitude, IsLongitude, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";

export class Location {
  @IsLatitude()
  @IsNumber()
  latitude: number;

  @IsLongitude()
  @IsNumber()
  longitude: number;
}
export class AddressDetails {
  @IsNotEmpty({ message: "Address is required" })
  @IsString()
  address: string;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Location)
  location: Location;

  @IsString()
  locality: string;

  @IsString()
  city: string;

  pincode: string;
}

export class EditAddressDetails extends AddressDetails {
  @IsNotEmpty({ message: "AddressID is required" })
  @IsNumber()
  @IsPositive()
  address_id: number;
} 

export class OptionalEditAddressDetails extends AddressDetails {
  @IsOptional()
  @IsNotEmpty({ message: "AddressID is required" })
  @IsNumber()
  @IsPositive()
  address_id: number;
} 