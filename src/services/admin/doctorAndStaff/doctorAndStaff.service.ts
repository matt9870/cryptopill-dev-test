import { get } from "config";
import { NotFoundError } from "routing-controllers";
import { RolesEnum } from "../../../constants/roles.enum";
import { StatusCode } from "../../../constants/status_code.enum";
import sequelize from "../../../db/sequalise";
import DrSchedule from "../../../models/dr_schedule.model";
import ProfileDetails from "../../../models/profile_details.model";
const { QueryTypes } = require("sequelize");

const { AWS_FILE_UPLOAD_LINK } = get("APP");

export class DoctorAndStaffService {
	async getDoctorAndStaff(
		limit: number,
		offset: number,
		search: string,
		status: string,
		type: string,
		sort: string,
		order: string = "asc",
		user_id?: number
	) {
		let subqueryalias = "ps";
		let accoutnStatus: any = {
			all: "",
			inactive: `${subqueryalias}.active_status = 0`,
			unverified_new: `${subqueryalias}.status_code = 2 AND ${subqueryalias}.active_status = 1`,
			unverified_edit: `${subqueryalias}.status_code = 3 AND ${subqueryalias}.active_status = 1`,
			verified: `${subqueryalias}.status_code = 1 AND ${subqueryalias}.active_status = 1`,
		};

		let accounttype: any = {
			all: "",
			doctor: RolesEnum.Doctor,
			supportstaff: RolesEnum.Staff,
		};
		let typecase =
			type && accounttype[type.toLowerCase()]
				? `${subqueryalias}.role_id = '${accounttype[type.toLowerCase()]}'`
				: true;

		let whereclause = "";
		const limitcase =
			offset > 0 ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

		let statuscase =
			status && accoutnStatus[status.toLowerCase()]
				? `${accoutnStatus[status.toLowerCase()]}`
				: true;
		let filtercase = `${typecase} AND ${statuscase}`;

		let searchcase = `${subqueryalias}.first_name like '%${search}%' OR ${subqueryalias}.last_name like '%${search}%' OR ${subqueryalias}.full_name like '%${search}%' OR ${subqueryalias}.user_id like '%${search}%' OR ${subqueryalias}.contact_number like '%${search}%' OR ${subqueryalias}.email like '%${search}%'`;
		let orderbycase = sort
			? `order by ${subqueryalias}.${sort} ${order}`
			: `order by ${subqueryalias}.user_id desc`;
		if (!user_id) {
			whereclause = search
				? `where (${searchcase}) AND (${filtercase}) ${orderbycase}`
				: `where (${filtercase}) ${orderbycase}`;
		} else {
			whereclause = `where user_id = ${user_id}`;
		}

		const query = `
            select * from (select 
				usr.id as user_id , usr.first_name , usr.middle_name , usr.last_name ,CONCAT(usr.first_name ,' ', usr.last_name) as full_name, usr.birth_date , usr.contact_number , usr.email , usr.gender , 
				  Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', usr.id ,'/profile_picture' , '/' , usr.profile_image) as profile_image,
				  if(new_profile_image IS NOT NULL , Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', usr.id ,'/profile_picture' , '/' , usr.new_profile_image) , null ) as new_profile_image,
				  usr.profile_image_verify,
				  dusr.experience , dusr.is_Profession_Verified , dusr.medical_convention, dusr.prescription_days_week_month , dusr.prescription_limit, dusr.video_call, dusr.audio_call, dusr.physical_examination, 
				  regdetail.council_id,regdetail.organization,regdetail.registration_number,regdetail.registration_year,
				  doc.type , doc.number,
				  if(usrrole.verify_account = 0 , 0 ,1 ) as isVerified,
				  profstat.id as professional_status_code , profstat.status_name as professional_status_name,
				  imgstat.id as image_status_code , imgstat.status_name as image_status_name, 
				  stat.id as status_code,stat.status_name , 
				  usrrole.id as user_role_id , usrrole.role_id , usrrole.active_status ,usrrole.isWorkplaceAdmin , role.role , 
				  GROUP_CONCAT(qual.education) as qualification ,GROUP_CONCAT(qual.id) as qualification_id , 
				  group_concat(spec.name) as specialities ,group_concat(spec.id) as specialities_id  , 
				  group_concat(uni.university_name) as universities ,group_concat(uni.id) as universities_id ,
				  if((select user_id from user_role where role_id  = (select id from roles where role = "Doctor") and user_id = usr.id LIMIT 1) IS NULL , 0,1 ) as isDoctor,
				  if((select user_id from user_role where role_id  = (select id from roles where role = "Laboratory") and user_id = usr.id LIMIT 1) IS NULL , 0,1 ) as isLab,
				  if((select user_id from user_role where role_id  = (select id from roles where role = "Pharmacy") and user_id = usr.id LIMIT 1) IS NULL , 0,1 ) as isPharma,
				  if((select user_id from user_role where role_id  = (select id from roles where role = "Patient") and user_id = usr.id LIMIT 1) IS NULL , 0,1 ) as isPatient
				  from user_role usrrole join roles role on usrrole.role_id = role.id and role in ("Doctor" , "Staff")
				  join user_status_code stat on stat.id = usrrole.status_code
				  join users usr on usr.id = usrrole.user_id
				  left join dr_users dusr on dusr.doctor_id = usr.id
				  left join user_status_code profstat on profstat.id = dusr.profession_status_code
				  left join medical_registrar_detail regdetail on regdetail.doctor_id = usr.id
				  left join dr_workplace_users d on usr.id = d.user_id
				  left join dr_workplaces drwrkplace on d.workplace_id = drwrkplace.id
				  left join dr_qualifications dqual on dqual.doctor_id = usr.id
				  left join dr_speciality dspec on dspec.d_id = usr.id
				  left join specialities_speciality spec on spec.id = dspec.speciality_id
				  left join qualifications qual on dqual.qualification_id = qual.id
				  left join universitys uni on dqual.university_id = uni.id
				  left join identity doc on doc.user_id = usr.id
				  left join user_status_code imgstat on imgstat.id = usr.image_status_code
				  group by usr.id) as ${subqueryalias} ${whereclause}`;

		let details = await sequelize.query(`${query} ${limitcase};`, {
			replacements: { limitcase: limitcase },
			type: QueryTypes.SELECT,
		});

		for (let index = 0; index < details.length; index++) {
			let currentElement: any = details[index];
			currentElement.qualification = !!currentElement.qualification
				? [...new Set(currentElement.qualification.split(","))]
				: currentElement.qualification;
			currentElement.qualification_id = !!currentElement.qualification_id
				? [...new Set(currentElement.qualification_id.split(","))]
				: currentElement.qualification_id;
			currentElement.specialities = !!currentElement.specialities
				? [...new Set(currentElement.specialities.split(","))]
				: currentElement.specialities;
			currentElement.specialities_id = !!currentElement.specialities_id
				? [...new Set(currentElement.specialities_id.split(","))]
				: currentElement.specialities_id;
			currentElement.universities = !!currentElement.universities
				? [...new Set(currentElement.universities.split(","))]
				: currentElement.universities;
			currentElement.universities_id = !!currentElement.universities_id
				? [...new Set(currentElement.universities_id.split(","))]
				: currentElement.universities_id;

			const query = `select b.workplace_name , b.workplace_contact_number,b.consultation_fee , 
			b.time_per_appointment as time_per_appointment, b.id as workplace_id , 
            ST_X(c.location) as latitude , ST_Y(c.location) as longitude,
            c.address , c.city ,c.pincode , c.locality , c.id as address_id
            from dr_workplace_users a join dr_workplaces b on a.workplace_id = b.id
            join address c on c.id = b.address_id where a.user_id = ${currentElement.user_id}`;

			const workplaces = await sequelize.query(query, {
				type: QueryTypes.SELECT,
			});
			for (let i = 0; i < workplaces.length; i++) {
				let where: any = { workplaces_id: workplaces[i].workplace_id };
				if (user_id) {
					where.doctor_id = details[index].user_id;
				}
				workplaces[i].schedule = await DrSchedule.findAll({
					order: ['start_time'],
					where: where,
					raw: true,
				});
			}
			currentElement.workplaces =
				workplaces && workplaces.length > 0 ? workplaces : [];
		}

		if (user_id) {
			if (!details.length) throw new NotFoundError("User not found");

			if (details[0].role_id === RolesEnum.Staff) {
				return details[0];
			}
			// If profile details have unverfied entry
			let profileData: any = await ProfileDetails.findAll({
				where: { user_id: user_id, role_id: RolesEnum.Doctor },
				order: [["createdAt", "DESC"]],
				attributes: [
					"id",
					"profile_data",
					"new_profile_data",
					"status_code",
					"createdAt",
					"updatedAt",
				],
				raw: true,
			});
			if (profileData[0] &&
				(profileData[0].status_code === StatusCode.Unverified_new ||
					profileData[0].status_code === StatusCode.Unverified_edit)
			) {
				let {
					new_profile_data,
					status_code,
					id,
					createdAt,
					updatedAt,
				} = profileData[0];
				let {
					professionalInformation,
					educationalQualification,
				} = new_profile_data;

				let eduDetails = [
					...new Set(
						educationalQualification.educationDetails.map(
							(el: any) => el.qualification_id
						)
					),
				];
				let councilDetails = educationalQualification.mrdData.council_id;

				let unverfiedDataObj = {
					profile_id: id,
					birth_date: professionalInformation.drInfo.birth_date,
					email: professionalInformation.drInfo.email,
					gender: professionalInformation.drInfo.gender,
					experience: professionalInformation.drInfo.experience,
					specialities_id: professionalInformation.specialites,
					registration_number:
						educationalQualification.mrdData.registration_number,
					registration_year: educationalQualification.mrdData.registration_year,
					professional_status_code: status_code,
					professional_status_name: StatusCode[status_code],
					qualification_id: eduDetails,
					council_id: councilDetails,
					medical_convention: details[0].medical_convention,
					createdAt,
					updatedAt,
				};
				details[0]["unverfied_data"] = unverfiedDataObj;
			} else {
				details[0]["unverfied_data"] = null;
			}

			return details[0];
		} else {
			const total_count: any = await sequelize.query(
				`select count(*) as count from (${query}) as tempAllies`,
				{
					type: QueryTypes.SELECT,
				}
			);

			return {
				details,
				limit: limit,
				offset: offset,
				total_count: total_count[0].count,
			};
		}
	}

	async getAllAppointments(
		limit: number,
		offset: number,
		search: string,
		status: string,
		sort: string,
		order: string = "asc",
		doctor_id: number,
		patient_id: number
	) {
		let subqueryalias = "pa";
		let appointmentStatus: any = {
			all: "",
			accepted: `${subqueryalias}.is_cancelled = 0 AND status not like "Completed" AND ${subqueryalias}.status not like "%Declined by doctor%"`,
			completed: `${subqueryalias}.status like "Completed"`,
			cancelled_by_doctor: `${subqueryalias}.is_cancelled = 1 AND ${subqueryalias}.status like "%cancelled by doctor%"`,
			cancelled_by_patient: `${subqueryalias}.is_cancelled = 1 AND ${subqueryalias}.status like "%cancelled by patient%"`,
			declined_by_doctor: `${subqueryalias}.status like "%Declined by doctor%"`,
			no_response_from_doctor_yet: `${subqueryalias}.status like "%No response from doctor%"`,
			timedout: `${subqueryalias}.status like "Timedout"`,
		};

		let whereclause = "";
		const limitcase =
			offset > 0 ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

		let statuscase =
			status && appointmentStatus[status.toLowerCase()]
				? `${appointmentStatus[status.toLowerCase()]}`
				: true;
		// let filtercase = cancel_reason && cancel_reason !== 'any' ? `${subqueryalias}.cancelled_reason like "%${cancel_reason}%" AND ${statuscase}` : `${statuscase}`;

		let searchcase = `${subqueryalias}.booking_id = ${search} OR ${subqueryalias}.cryptopill_id = ${search}`;
		let orderbycase = sort
			? `order by ${subqueryalias}.${sort} ${order}`
			: `order by ${subqueryalias}.datetime desc`;

		whereclause = search
			? `where (${searchcase}) AND (${statuscase}) ${orderbycase}`
			: `where (${statuscase}) ${orderbycase}`;

		let userIdByRoleCase = doctor_id
			? `doctor_id = ${doctor_id}`
			: patient_id
				? `patient_id = ${patient_id}`
				: true;
		const query = `select * from 
        (select pt_appoint.id as booking_id, bookedby,patient_id as cryptopill_id, concat(u.first_name, " " ,u.last_name) as patient_name, concat(pt_appoint.date, " ",pt_appoint.start_time, "-", pt_appoint.end_time) as Datetime,
        is_cancelled, cancelled_reason,
        case
            WHEN is_cancelled = 1 THEN  concat('Cancelled by ', pt_appoint.cancellby) 
            ELSE pt_appoint.status 
        end as status
        from dr_patient_appoiment as pt_appoint join users as u on  u.id= pt_appoint.patient_id where ${userIdByRoleCase}) as ${subqueryalias} ${whereclause}`;

		let details = await sequelize.query(`${query} ${limitcase};`, {
			replacements: { limitcase: limitcase },
			type: QueryTypes.SELECT,
		});

		const total_count: any = await sequelize.query(
			`select count(*) as count from (${query}) as tempAllies`,
			{
				type: QueryTypes.SELECT,
			}
		);

		return {
			details,
			limit: limit,
			offset: offset,
			total_count: total_count[0].count,
		};
	}
}
