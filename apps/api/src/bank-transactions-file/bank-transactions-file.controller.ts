import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Response,
  Delete,
  StreamableFile,
  forwardRef,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import 'multer'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { FilesTypesDto } from './dto/files-type.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { PersonService } from '../person/person.service'


@Controller('bank-transactions-file')
export class BankTransactionsFileController {
  constructor(
    private readonly bankTransactionsFileService: BankTransactionsFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) {}

  @Post(':bank_transactions_file_id')
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('bank_transactions_file_id') bankTransactionsFileId: string,
    @Body() body: FilesTypesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const keycloakId = user.sub as string
    const person = await this.personService.findOneByKeycloakId(keycloakId)
    if (!person) {
      Logger.warn('No person record with keycloak ID: ' + keycloakId)
      throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parseString = require('xml2js').parseString
    const xml = '<root>Hello xml2js!</root>'

    return await Promise.all(
      files.map((file, key) => {
        parseString(file.buffer, function (err, items) {
          for (const object in items) {
            for (const movement in items[object].AccountMovement) {
              console.log('-------------------------------------')
              console.log(items[object].AccountMovement[movement]);

            }
          }
        })
// reason -> paymentRef -> finding campaign -> get campaign -> get vaultById /firstOne/-> get ID
// the amount have to multiplied by 100 to be accurate
// extPaymentMethodId -> bank payment
// DocumentReference -> extPaymentIntentId
// BankClientID -> extCustomerId
        const filesType = body.types
        return this.bankTransactionsFileService.create(
          Array.isArray(filesType) ? filesType[key] : filesType,
          file.originalname,
          file.mimetype,
          bankTransactionsFileId,
          person,
          file.buffer,
        )
      }),
    )
  }

  @Get()
  findAll() {
    return this.bankTransactionsFileService.findAll()
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.bankTransactionsFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.bankTransactionsFileService.remove(id)
  }
}
