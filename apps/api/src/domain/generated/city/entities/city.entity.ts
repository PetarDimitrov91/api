
import {Country} from '../../country/entities/country.entity'
import {Beneficiary} from '../../beneficiary/entities/beneficiary.entity'


export class City {
  id: string ;
name: string ;
postalCode: string ;
countryId: string ;
countryCode?: Country ;
beneficiaries?: Beneficiary[] ;
}
