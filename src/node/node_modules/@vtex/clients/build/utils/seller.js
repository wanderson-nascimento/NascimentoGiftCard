"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSellerInformation = void 0;
exports.checkSellerInformation = (sellerInformation) => {
    const seller = {
        Description: '',
        ExchangeReturnPolicy: '',
        DeliveryPolicy: '',
        UserName: '',
        Password: '',
        SecutityPrivacyPolicy: '',
        CNPJ: '',
        ArchiveId: '',
        UrlLogo: '',
        IsActive: true,
        FulfillmentSellerId: '',
        SellerType: 1,
        IsBetterScope: false,
        MerchantName: '',
    };
    return {
        ...seller,
        ...sellerInformation,
    };
};
