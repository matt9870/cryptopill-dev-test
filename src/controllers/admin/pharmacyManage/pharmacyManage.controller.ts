import { Body, Get, JsonController, Post, QueryParam, QueryParams } from "routing-controllers";
import { RolesEnum } from "../../../constants/roles.enum";
import { PharmacyUserManageServices } from "../../../services/admin/pharmacyManagement/pharmacyUserManage.service";
import { PharmacyService } from "../../../services/mobile/pharmacy/pharmacy.service";
import { LabPharmacyService } from "../../../services/shared/labPharmacy.service";
import { AdminLabPharmacyUsersSearch, AdminPharmacistSearch, PharmacyOrderSearch } from "../../../validations/comman/basicInfo.validations";

@JsonController('/admin')
export class PharmacyManageController {
    constructor(private pharmaAdminSrv: PharmacyUserManageServices, private pharmaSrv: PharmacyService,
        private labPharmaSrv: LabPharmacyService) { }

    /**
     * method: Get
     * url: serverUrl:Port/admin/getPharmacists
     * queryparams: @type{number} limit, @type{number} offset, @type{string} type,  @type{string} search, @type{string} sort, @type{string} order
     * description: To fetch list of all pharmacists working in a pharmacy workplace.
     * 
     * For pharmacists By ID Case
     * queryparams: @type{number} user_id
     * description: To fetch single entry for specific pharmacists & fetch its details.
     */
    @Get('/pharmacyUsers')
    async getPharmacists(@QueryParams({ validate: true }) query: AdminLabPharmacyUsersSearch) {
        return this.pharmaAdminSrv.getPharmacistProfiles(query.limit, query.offset, query.type, query.search, query.sort, query.order, query.user_id, query.workplace_id);
    }

    @Post('/addPharmacyEmployee')
    async addEmployee(@Body() body: any) {
        const { user_details, pharmacyDetails } = body;
        user_details.role_id = RolesEnum.Pharmacy;
        if (!!pharmacyDetails.workplace_id) {
            return this.labPharmaSrv.addEmployee(user_details, pharmacyDetails.workplace_id);
        }
        const { pharmacyWorkplaces } = await this.pharmaSrv.upsertSetUpProfileDetails(body, true);
        return this.labPharmaSrv.addEmployee(user_details, pharmacyWorkplaces[0]);

    }

    @Post("/addPharmacy")
    addSetupProfileDetails(@Body({ validate: true }) body: any) {
        return this.pharmaSrv.upsertSetUpProfileDetails(body, true);
    }

    @Get('/allPharmacies')
    async getAllPharmacies(@QueryParams({ validate: true }) query: AdminPharmacistSearch) {
        return this.pharmaAdminSrv.getAllPharmacies(query.limit, query.offset, query.status, query.search, query.sort, query.order, query.workplace_id)
    }

    @Post('/pharmacy/updateDeliveryInfo')
    updateDeliveryInfo(@Body() body: any) {
        return this.pharmaAdminSrv.updateDeliveryAndDiscountInfo(body);
    }

    @Post('/verifyPharmacy')
    verifyPharmacy(@Body() body: any) {
        const { workplace_id, isVerified } = body;
        return this.pharmaAdminSrv.verifyPharmacy(workplace_id, isVerified);
    }

    @Get('/getPharmacyOrders')
    getPharamacyOrder(@QueryParams({ validate: true }) query: PharmacyOrderSearch) {
        return this.pharmaAdminSrv.getPhramacyOrder(query.limit, query.offset, query.search, query.status, query.sort, query.order, query.patient_id, query.pharmacy_user_id)
    }

    @Get('/pharmacy/viewOrder')
    viewOrder(@QueryParam("order_id", { validate: true }) order_id: string, @QueryParam("pharmacy_user_id") pharma_id: number, @QueryParam("user_id") user_id: number, @QueryParam("prescription_type") pType: string, @QueryParam("inprocess") isInProcess: boolean) {
        return this.pharmaAdminSrv.viewOrder(order_id, pharma_id, user_id, pType, isInProcess)
    }

}