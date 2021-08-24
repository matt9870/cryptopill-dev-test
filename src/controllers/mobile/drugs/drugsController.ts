import { Get, Post, QueryParam, JsonController, Body } from "routing-controllers";
import { DrugService } from "../../../services/mobile/drugs/drugs.service";
import { AddDrugs } from "../../../validations/comman/basicInfo.validations";
// import { DrugService } from "../../../services/drugs/drugs.service";

@JsonController('/drug')
export class DrugsController {

    constructor(private drugSrv: DrugService) { }

    @Get('/getAll')
    async getAll(@QueryParam("id") id: any) {
        // const contactlib = new ContactLib();
        // throw new Error("dummy error")
        let contacts = await this.drugSrv.getAllDrugs();
        return contacts;
    }

    // @Post('/addDrugs')
    // async addDrugs(@Body() drug: any) {
    //     await this.drugSrv.addNewDrugs(drug);
    //     return { msg: 'Drug added sucessfully' };
    // }

    @Post('/addAllDrugs')
    async addAllDrugs(@Body({ validate: true }) body: AddDrugs) {
        return this.drugSrv.addAllDrugs(body.drugs);;
    }
}