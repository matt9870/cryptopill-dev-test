import { Get, JsonController, QueryParam } from "routing-controllers";
import { AddressService } from "../../services/shared/address.service";

@JsonController("/address")
export class AddressController {
    constructor(private addSrv: AddressService) { }

    @Get("/search")
    searchAddress(@QueryParam("search") address: string) {
        return this.addSrv.searchAddress(address);
    }
}