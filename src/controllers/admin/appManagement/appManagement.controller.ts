import { Body, Get, JsonController, Param, Post, QueryParam, QueryParams, CurrentUser } from "routing-controllers";
import { AppManagementService } from "../../../services/admin/appManagement/appManagement.service";
import { LibraryService } from "../../../services/admin/Library/library.service";
import { DrugService } from "../../../services/mobile/drugs/drugs.service";
import { BadRequestError } from "routing-controllers";

@JsonController("/admin")
export class AppManageController {

    constructor(private appSrv: AppManagementService, private drugSrv: DrugService, private libsrv: LibraryService) { }
    @Get("/address/role_id/:role_id")
    async get(@Param("role_id") role_id: number, @QueryParam("search") search: string, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number) {
        return this.appSrv.getWorkplaceAddress(role_id, search, limit, offset);
    }

    @Post("/address/edit/role_id/:role_id")
    async editAddress(@Body() body: any, @Param("role_id") role_id: number) {
        return this.appSrv.updateAddress(body, role_id);
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/addEditDrug
     * body: @type{JSONObject} body
     * description: Admin use this to add the drugs in master table.
     */
    @Post('/addEditDrug')
    async addDrugs(@Body() drug: any, @CurrentUser() user: any) {
        if (!Array.isArray(drug)) {
            let isExist = await this.drugSrv.isDrugNameExist(drug);
            if (isExist) {
                throw new BadRequestError("Drug name already exist.")
            }
        }
        return await this.drugSrv.addNewDrugs(drug, user.id);
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/pharmacy/updatePharmacyDrug
     * body: @type{JSONObject} body
     * description: Admin use this to add the drugs to pharmacy.
     */
    @Post('/pharmacy/updatePharmacyDrug')
    updatePharmacyDrugs(@Body() body: any) {
        let { pharmacy_drug, pharmacy_id } = body;
        return this.appSrv.saveUpdatePharmacyDrug(pharmacy_drug, pharmacy_id);
    }
    /**
     * method: GET
     * url: serverUrl:Port/admin/pharmacy/pharmacyDrug
     * description: Admin use this to get the drugs list of particular pharmacy.
     */
    @Get("/pharmacy/pharmacyDrug")
    async getPharmacyDrug(@QueryParams({ validate: true }) query: any) {
        const result = await this.appSrv.getPharmacyDrugsData(query.pharmacy_id, null, null, null, true);
        return result;
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/mergeDrug
     * body: @type{JSONObject} body
     * description: Admin use this to merge the drugs in master table.
     */
    @Post("/mergeDrug")
    async mergeMasterDrug(@Body() body: any, @CurrentUser() user: any) {
        const result = await this.appSrv.mergeDrugsData(body, user.id);
        return result;
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/drugActiveInactive
     * body: @type{JSONObject} body
     * description: Admin use this to make the drug independent( mark it as active) or make it inactive
     */
    @Post("/drugActiveInactive")
    async markDrugActive(@Body() body: any, @CurrentUser() user: any) {
        const result = await this.appSrv.activeDiactiveDrugData(body, user.id);
        return result;
    }

    /**
     * method: GET
     * url: serverUrl:Port/admin/drugInfo/:drug_id
     * description: Admin use this to get the drugs info by drug id.
     */
    @Get("/drugInfo/:drug_id")
    getMasterDrugDetails(@Param("drug_id") drug_id: number) {
        const result = this.drugSrv.getDrugByID(drug_id);
        return result;
    }

    /**
     * method: GET
     * url: serverUrl:Port/admin/mergedDrug/:drug_id
     * description: Admin use this to get the drugs merged drugs by drug id.
     */
    @Get("/mergedDrug/:drug_id")
    async getMergedDrugsList(@Param("drug_id") drug_id: number, @QueryParam("sort") sort: string, @QueryParam("order") order: string, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number) {
        return await this.libsrv.getLibraryDetails("merged_drugs", '', undefined, sort, order, limit, offset, drug_id);
    }

    /**
     * method: GET
     * url: serverUrl:Port/admin/drugHistory/:drug_id
     * description: Admin use this to get the drugs change history by drug id.
     */
    @Get("/drugHistory/:drug_id")
    async getDrugHistoryList(@Param("drug_id") drug_id: number, @QueryParam("sort") sort: string, @QueryParam("order") order: string, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number) {
        return await this.libsrv.getLibraryDetails("drugs_history", '', undefined, sort, order, limit, offset, drug_id);
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/timeout
     * body: @type{JSONObject} body
     * description: Admin use this to change timeouts
     */
    @Post("/timeout")
    async changeTimeout(@Body() body: any) {
        const result = await this.appSrv.timeoutAddEdit(body);
        return result;
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/mergeAllergies
     * body: @type{JSONObject} body
     * description: Admin use this to merge the allergies.
     */
    @Post("/mergeAllergies")
    async mergeAllergies(@Body() body: any) {
        const result = await this.appSrv.mergeAllergiesData(body);
        return result;
    }

    /**
     * method: GET
     * url: serverUrl:Port/admin/symptoms/:symptoms_id
     * description: Admin use this to get the symptoms info by symptoms_id.
     */
    @Get("/symptoms/:symptoms_id")
    getSymptomsDetails(@Param("symptoms_id") symptoms_id: number) {
        const result = this.libsrv.getSymptomsById(symptoms_id);
        return result;
    }
    /**
     * method: Post
     * url: serverUrl:Port/admin/allergiesActiveInactive
     * body: @type{JSONObject} body
     * description: Admin use this to make the allergy independent( mark it as active) or make it inactive
     */
    @Post("/allergiesActiveInactive")
    async markAllergiesActive(@Body() body: any, @CurrentUser() user: any) {
        const result = await this.appSrv.activeDiactiveAllergiesData(body, user.id);
        return result;
    }


    /**
     * method: GET
     * url: serverUrl:Port/admin/mergedAllergies/:allergy_id
     * description: Admin use this to get the alergy merged allergies by allergy id.
     */
    @Get("/mergedAllergies/:allergy_id")
    async getMergedAllergiesList(@Param("allergy_id") allergy_id: number, @QueryParam("sort") sort: string, @QueryParam("order") order: string, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number) {
        return await this.libsrv.getLibraryDetails("merged_allergies", '', undefined, sort, order, limit, offset, allergy_id);
    }

    /**
     * method: GET
     * url: serverUrl:Port/admin/getDrugManufacturer
     * description: Admin use this to get the drugs Manufacturer list.
     */
    @Get("/getDrugManufacturer")
    async getDrugManufacturerList() {
        return await this.libsrv.getManufacturer();
    }


    /**
   * method: Get
   * url: serverUrl:Port/admin/timeout?timeout_for=:timeout_for
   * queryparams: @type{string} timeout_for
   * description: To fetch timeout value.
   */
    @Get("/timeout")
    async getLabUserProfiles(@QueryParam('timeout_for', { required: true }) timeout_for: string) {
        return this.appSrv.getTimeout(timeout_for);
    }

}