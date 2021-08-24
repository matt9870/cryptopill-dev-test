import { Body, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { DoctorAnalyticsService } from "../../services/analytics/doctorAnalytics.service";
import { LaboratoryAnalyticsService } from "../../services/analytics/labAnalytics.service";
import { PatientAnalyticsService } from "../../services/analytics/patientAnalytics.service";
import { PharmacyAnalyticsService } from "../../services/analytics/pharmacyAnalytics.service";
import { DoctorAnalyticsActions, LabAnalyticsActions, PatientAnalyticsActions, PhamrmacyAnalyticsActions } from "../../validations/comman/analytics.validations";

@JsonController("/analytics")
export class AddressController {
    constructor(
        private panASrv: PatientAnalyticsService,
        private phmASrv: PharmacyAnalyticsService,
        private labASrv: LaboratoryAnalyticsService,
        private docASrv: DoctorAnalyticsService
    ) { }

    @Post("/patientAnalytics")
    async addPatientAnalitycsEvent(@Body() body: PatientAnalyticsActions) {
        return this.panASrv.addPatientAnalitycsEvent(body.key, body.data);
    }

    @Post("/pharmacyAnalytics")
    async addPharmAnalitycsEvent(@Body() body: PhamrmacyAnalyticsActions) {
        return this.phmASrv.addPharmAnalitycsEvent(body.key, body.data);
    }

    @Post("/laboratoryAnalytics")
    async addLabAnalitycsEvent(@Body() body: LabAnalyticsActions) {
        return this.labASrv.addLabAnalitycsEvent(body.key, body.data);
    }

    @Post("/doctorAnalytics")
    async addDoctorAnalitycsEvent(@Body() body: DoctorAnalyticsActions) {
        return this.docASrv.addDoctorAnalitycsEvent(body.key, body.data);
    }
}