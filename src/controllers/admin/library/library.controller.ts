import { BadRequestError, Body, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { LibraryService } from "../../../services/admin/Library/library.service";


@JsonController('/library')
export class LibraryController {

    constructor(private libsrv: LibraryService) { }
    /**
     * method: Get
     * url: serverUrl:Port/library/getLibrary
     * queryparam: @type{string} library_name  (model name is library name)
     * description: Use in Admin panel & on Mobile side to fecth list of entries show data like list of specialites,Tests, qualifications etc.
     */
    @Get('/getLibrary')
    async getLibrary(@QueryParam('library_name', { required: true }) name: string, @QueryParam("status") status: string, @QueryParam("search") txt: string, @QueryParam("sort") sort: string, @QueryParam("order") order: string, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number, @QueryParam("id") id: number, @QueryParam("is_admin") is_admin: number, @QueryParam("drug_manufacturer") drug_manufacturer: string, @QueryParam("drug_unit") drug_unit: string, @QueryParam("drug_route") drug_route: string, @QueryParam("drug_status") drug_status: number, @QueryParam("is_parent") is_parent: number) {
        return await this.libsrv.getLibraryDetails(name, txt, status, sort, order, limit, offset, id, is_admin != undefined ? true : false, drug_manufacturer, drug_unit, drug_route, drug_status, is_parent);
    }

    /**
     * method: Post
     * url: serverUrl:Port/library/saveLibrary
     * body: @type{JSONObject} body
     * description: Admin use this to populate various entry in db i.e, to add data like specialites,Tests, qualifications etc.
     */
    @Post('/saveLibrary')
    async saveLibrary(@Body() body: any) {


        if (!body.library_name) {
            throw new BadRequestError("Please provide libray_name")
        }
        let isExist = await this.libsrv.isNameExist(body);
        if (isExist.hasError) {
            throw new BadRequestError(isExist.msg)
        }
        return this.libsrv.saveupdateLibraryDetails(body);
    }

    @Post('/tests/save')
    async addUpdateTests(@Body() body: any) {
        let isExist = await this.libsrv.isTestNameExist(body);
        if (isExist.hasError) {
            throw new BadRequestError(isExist.msg)
        }
        return this.libsrv.createOrUpdate(body);
    }

    /**
     * method: Post
     * url: serverUrl:Port/library/deleteLibrary
     * body: @type{JSONObject} body
     * description: Admin use this to populate various entry in db i.e, to add data like specialites,Tests, qualifications etc.
     */
    @Post('/deleteLibrary')
    async deleteLibrary(@Body() body: any) {

        if (!body.library_name) {
            throw new BadRequestError("Please provide libray_name")
        }
        return this.libsrv.deleteLibraryDetails(body);
    }
}