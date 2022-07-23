export type SettingsObjectType = {
  emailBeta: SettingsObjectType_Bool
  hasThirdParty?: boolean
  siteTitle: SettingsObjectType_String
  siteUrl?: SettingsObjectType_String
  timezone?: SettingsObjectType_String
  timeFormat?: SettingsObjectType_String
  shortDateFormat?: SettingsObjectType_String
  longDateFormat?: SettingsObjectType_String
  hasCustomLogo?: SettingsObjectType_Bool
  customLogoFilename?: SettingsObjectType_String
  hasCustomPageLogo?: SettingsObjectType_Bool
  customPageLogoFilename?: SettingsObjectType_String
  hasCustomFavicon?: SettingsObjectType_Bool
  customFaviconFilename?: SettingsObjectType_String
  colorHeaderBG?: SettingsObjectType_String
  colorHeaderPrimary: SettingsObjectType_String
  colorPrimary: SettingsObjectType_String
  colorSecondary: SettingsObjectType_String
  colorTertiary: SettingsObjectType_String
  colorQuaternary: SettingsObjectType_String
  defaultTicketType: SettingsObjectType_String
  minSubjectLength: SettingsObjectType_Number
  minIssueLength: SettingsObjectType_Number
  defaultUserRole: SettingsObjectType_String
  mailerEnabled: SettingsObjectType_Bool
  mailerHost: SettingsObjectType_String
  mailerSSL: SettingsObjectType_Bool
  mailerPort: SettingsObjectType_Number
  mailerUsername: SettingsObjectType_String
  mailerPassword: SettingsObjectType_String
  mailerFrom: SettingsObjectType_String
  mailerCheckEnabled: SettingsObjectType_Bool
  mailerCheckPolling: SettingsObjectType_Number
  mailerCheckHost: SettingsObjectType_String
  mailerCheckPort: SettingsObjectType_Number
  mailerCheckUsername: SettingsObjectType_String
  mailerCheckPassword: SettingsObjectType_String
  mailerCheckSelfSign: SettingsObjectType_Bool
  mailerCheckTicketType: SettingsObjectType_String
  mailerCheckTicketPriority: SettingsObjectType_String
  mailerCheckCreateAccount: SettingsObjectType_Bool
  mailerCheckDeleteMessage: SettingsObjectType_Bool


}

export type SettingsObjectType_Base = {
  name: string
  value: any
}

export interface SettingsObjectType_Object extends SettingsObjectType_Base {
  value: object
}

export interface SettingsObjectType_String extends SettingsObjectType_Base {
  value: string
}

export interface SettingsObjectType_Number extends SettingsObjectType_Base {
  value: number
}

export interface SettingsObjectType_Bool extends SettingsObjectType_Base {
  value: boolean
}
