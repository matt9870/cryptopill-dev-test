import Users from "../../models/users.model";
import Identity from "../../models/identity.model";

export class UserProfileService {
  public static async updateProfile(body: any) {
    const {
      first_name,
      middle_name,
      last_name,
      contact_number,
      gender,
      birth_date,
      email,
      lab_or_pharma_employement_number,
      document_type,
      document_number,
      id
    } = body.personal_information;

    const user_id = id;
    // updating users table
    const userBody = {
      first_name,
      middle_name,
      last_name,
      email,
      gender,
      birth_date,
      contact_number,
      lab_or_pharma_employement_number,
    };

    await Users.update(userBody, {
      where: {
        id: user_id,
      },
    });

    // updating identity table
    await Identity.update(
      {
        type: document_type,
        number: document_number,
      },
      {
        where: {
          user_id,
        },
      }
    );

    return { message: "User Profile Updated Successfully" };
  }
}
