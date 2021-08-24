import { Body, Get, JsonController, Post, QueryParam, QueryParams } from "routing-controllers";
import { RolesEnum } from "../../../constants/roles.enum";
import { AdminLaboratoryService } from "../../../services/admin/laboratoryManagement/labmanagement.service";
import { LaboratoryService } from '../../../services/mobile/laboratory/laboratory.service'
import { LabPharmacyService } from "../../../services/shared/labPharmacy.service";
import { AdminLabPharmacyUsersSearch, AdminPharmacistSearch, LabOrderSearch } from "../../../validations/comman/basicInfo.validations";
@JsonController("/admin")
export class LaboratoryController {
  constructor(private labAdminService: AdminLaboratoryService, private labSrv: LaboratoryService,
    private labPharmaSrv: LabPharmacyService) { }

  /**
    * method: Get
    * url: serverUrl:Port/admin/laboratory/users
    * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} type, @type{string} sort, @type{string} order
    * description: To fetch list of all laboratory employee's working in a lab workplace.
    */
  @Get("/laboratory/users")
  async getLabUserProfiles(
    @QueryParams({ validate: true }) query: AdminLabPharmacyUsersSearch
  ) {
    return this.labAdminService.getAllLabUsers(
      query.limit,
      query.offset,
      query.search,
      query.type,
      query.sort,
      query.order,
      query.workplace_id,
      query.user_id
    );
  }

  @Post("/addLaboratory")
  addSetupProfileDetails(@Body({ validate: true }) body: any) {
    return this.labAdminService.upsertSetUpProfileDetails(body);
  }

  @Post('/addLabEmployee')
  async addEmployee(@Body() body: any) {
    const { user_details, laboratoryDetails } = body;
    user_details.role_id = RolesEnum.Laboratory;
    if (!!laboratoryDetails.workplace_id) {
      return this.labPharmaSrv.addEmployee(user_details, laboratoryDetails.workplace_id);
    }
    const { labWorkplaces } = await this.labSrv.upsertSetUpProfileDetails(body, true);
    return this.labPharmaSrv.addEmployee(user_details, labWorkplaces[0]);

  }

  /**
   * method: Get
   * url: serverUrl:Port/admin/getLaboratoriesList
   * queryparams: @type{number} limit, @type{number} offset, @type{string} type,  @type{string} search, @type{string} sort, @type{string} order
   * description: To fetch list of all Laboratories.
   * 
   * For Laboratory By ID Case
   * queryparams: @type{number} user_id
   * description: To fetch single entry for specific laboratory & fetch its details.
   */
  @Get("/labUsers")
  async getLaboratoriesList(@QueryParams({ validate: true }) query: AdminLabPharmacyUsersSearch) {
    return this.labAdminService.getLaboratoriesUsers(query.limit, query.offset, query.type, query.search, query.sort, query.order, query.user_id, query.workplace_id)
  }

  @Get('/getAllLabs')
  async getAllLabs(@QueryParams({ validate: true }) query: AdminPharmacistSearch) {

    if (query.workplace_name) {
      return this.labAdminService.getLabDetails(query.workplace_name);
    }
    if (query.franchise) {
      return this.labAdminService.getLabDetails(null, query.franchise);
    }
    return this.labAdminService.getAllLaboratories(query.limit, query.offset, query.status, query.search, query.sort, query.order, query.workplace_id)
  }

  @Post('/verifyLab')
  verifyPharmacy(@Body() body: any) {
    const { workplace_id, isVerified } = body;
    return this.labAdminService.verifyLab(workplace_id, isVerified);
  }

  @Get('/getLabOrders')
  getPharamacyOrder(@QueryParams({ validate: true }) query: LabOrderSearch) {
    return this.labAdminService.getLabOrder(query.limit, query.offset, query.search, query.status, query.sort, query.order, query.patient_id, query.lab_user_id)
  }

  @Get('/lab/viewOrder')
  viewOrder(@QueryParam("order_id", { validate: true }) order_id: string, @QueryParam("lab_user_id") pharma_id: number, @QueryParam("user_id") user_id: number, @QueryParam("prescription_type") pType: string, @QueryParam("inprocess") isInProcess: boolean) {
    return this.labAdminService.viewOrder(order_id, pharma_id, user_id, pType, isInProcess)
  }

  @Post('/lab/updateDeliveryAndDiscount')
  updateLabDiscountInfo(@Body() body: any) {
    return this.labAdminService.updateDiscountInfo(body);
  }

  // @Post('/lab/updateTests')
  // addTests(@Body() body: any) {
  //   return this.labAdminService.createOrUpdate(body);
  // }

  @Post('/lab/updateLabTest')
  updateLabTests(@Body() body: any) {
    let { lab_tests, lab_id } = body;
    return this.labAdminService.saveUpdateLabTest(lab_tests, lab_id);
  }

  @Get("/labTests")
  async getLabTests(@QueryParams({ validate: true }) query: any) {
    const result = await this.labSrv.getLabTestsData(query.lab_id, null, null, null, true);
    return result;
  }
}
