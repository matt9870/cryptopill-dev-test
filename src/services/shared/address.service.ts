import sequelize from "../../db/sequalise";
import Address from "../../models/address.model";
import { Op, QueryTypes } from 'sequelize'

export class AddressService {

    async addAddress(addressObj: any) {

        const { latitude, longitude } = addressObj.location;

        const isAddressExist = await this.isAddressExists(latitude, longitude);

        if (!!isAddressExist) {
            return isAddressExist;
        }

        if (!latitude || !longitude) {
            throw new Error("Location not added properly");
        }
        const coordinates: number[] = [latitude, longitude];
        const point = { type: "Point", coordinates: coordinates };
        addressObj.location = point;
        console.log(addressObj, "After");
        const address = await Address.create(addressObj);
        const lastEntry = await Address.findOne({
            limit: 1,
            order: [['id', 'DESC']]
        })

        console.log(lastEntry, "##LastEnty");
        return lastEntry;
    }

    async isAddressExists(latitude: any, longitude: any) {
        const isAddressExists = await sequelize.query(`
			select * from address
			where ST_X(location) = :lat and ST_Y(location) = :long
		` , {
            type: QueryTypes.SELECT,
            replacements: {
                lat: latitude,
                long: longitude
            }
        });

        return isAddressExists[0];
    }

    async nearByAddresses(latitude: number, longitude: number, maxDistance: number) {
        let searchRadiusCase = maxDistance > 0 ? `where places.distance < :maxDistance`: ''; 
        const query = `
            select * from 
            (select *,ST_distance_sphere( point( addr.longitude,addr.latitude), point(:longitude , :latitude)) 
            as distance from 
            (select id as address_id, ST_X(location) as latitude,ST_Y(location) as longitude, locality, address, city, pincode 
            from address) as addr) 
            as places
            ${searchRadiusCase} order by places.distance asc 
        `;

        const locationsAvailable: any[] = await sequelize.query(
            `${query}`, 
            {
            type: QueryTypes.SELECT,
            replacements: {
                latitude: latitude,
                longitude: longitude,
                maxDistance: maxDistance
            }
        });

        return locationsAvailable;
    }

    searchAddress(search: string) {
        return Address.findAll({
            where: {
                address: {
                    [Op.like]: `%%${search}%`
                }
            }
        });
    }
}