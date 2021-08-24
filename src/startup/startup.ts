import Roles from "../models/roles.model";
import user_status_code from "../models/user_status_codes";

export const start = () => {
    let data = [{
        "id": 0,
        "status_name": "Declined"
    },
    {
        "id": 1,
        "status_name": "Verified"
    },
    {
        "id": 2,
        "status_name": "Unverified (New)"
    },
    {
        "id": 3,
        "status_name": "Unverfied (Edit)"
    },
    {
        "id": 4,
        "status_name": "Awaiting Approval"
    },
    {
        "id": 5,
        "status_name": "Approved"
    },
    {
        "id": 6,
        "status_name": "New User"
    }
    ] as any[];

    user_status_code.bulkCreate(data)
}

start();