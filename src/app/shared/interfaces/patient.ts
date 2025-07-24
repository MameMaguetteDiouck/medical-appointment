export interface Patient {
    id : string,
    firstName : string,
    lastName : string,
    address : string,
    phone : number,
    birthDate ?: Date,
    email : string,
    description : string,
    status: string,
}
