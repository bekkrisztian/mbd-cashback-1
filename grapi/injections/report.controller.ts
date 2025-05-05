import { repository } from "@loopback/repository";

import { get, param, HttpErrors } from "@loopback/rest";


export class ReportsController {
    constructor(
        @repository.getter("PurchasepaybacksRepository")
        protected purchasePaybackRepositoryGetter: () => Promise<any>
    ) { }


    @get('reports/find', {
        responses: {
            '200': {
                description: 'Array of Report instances',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    Key: { type: 'string' },
                                    Challenge_Name: { type: 'string' },
                                    Challenge_Modul_Teilnahme: { type: 'string' },
                                    Jahr: { type: 'string' },
                                    Sparte: { type: 'string' },
                                    Modulcode: { type: 'string' },
                                    VFNR: { type: 'string' },
                                    Challenge_Woche: { type: 'number' },
                                    Anzahl: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        },
        parameters: [
            {
                name: 'filter',
                in: 'query',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                where: {
                                    type: 'object',
                                    properties: {
                                        from_date: { type: 'string' },
                                        to_date: { type: 'string' }
                                    },
                                    additionalProperties: false
                                }
                            }
                        }
                    }
                }
            }
        ]
    })
    async find(
        // infer from the parameters above
        filter?: { where?: { from_date?: string, to_date?: string } }
    ): Promise<any> {
        const { from_date, to_date } = filter?.where || {};

        const purchasePayback = await this.purchasePaybackRepositoryGetter();

        // const rawQuery = `select concat('Räder & Reifen Cashback-Challenge','_','2024','_','Pkw;Van','_',IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23'),'_',d.vfnr,'_',week(pp.approvedDate,1)) as 'Key', 'Räder & Reifen Cashback-Challenge' as Challenge_Name, '' as Challenge_Modul_Teilnahme, '2024' as Jahr, 'Pkw;Van' as Sparte, IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23') as Modulcode, d.vfnr as VFNR, week(pp.approvedDate,1) as Challenge_Woche, count(pp.id) as Anzahl from purchasepaybacks pp, purchasereceipts pr LEFT OUTER JOIN dealerships d ON pr.dealershipsId = d.id where pp.purchasereceiptsId = pr.id and pp.completed = 1 and (pp.status = 'PAID' or pp.status = 'APPROVED' or pp.status = 'PRE-PAYMENT') and pp.approvedDate > \"${from_date || "2023-01-01"}\" and pp.approvedDate < \"${to_date || "2024-12-31"}\" group by VFNR, Challenge_Woche, Modulcode`
        const rawQuery = `select concat('Räder & Reifen Cashback-Challenge','_','2024','_','Pkw;Van','_',IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23'),'_',d.vfnr,'_',week(pp.approvedDate,1)) as 'Key', 'Räder & Reifen Cashback-Challenge' as Challenge_Name, '' as Challenge_Modul_Teilnahme, '2024' as Jahr, 'Pkw;Van' as Sparte, IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23') as Modulcode, d.vfnr as VFNR, week(pp.approvedDate,1) as Challenge_Woche, count(pp.id) as Anzahl from purchasepaybacks pp, purchasereceipts pr LEFT OUTER JOIN dealerships d ON pr.dealershipsId = d.id where pp.purchasereceiptsId = pr.id and pp.completed = 1 and (pp.status = 'PAID' or pp.status = 'APPROVED' or pp.status = 'PRE-PAYMENT') and pp.approvedDate > \"${from_date || "2023-01-01"}\" and pp.approvedDate < \"${to_date || "2024-12-31"}\" group by VFNR, Challenge_Woche, Modulcode`
        return (await purchasePayback.execute(rawQuery));
    }


    @get('reports/count', {
        responses: {
            '200': {
                description: 'Successfully executes the query.',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' }
                            }
                        }
                    }
                }
            }
        },
        parameters: [
            {
                name: 'where',
                in: 'query',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                from_date: { type: 'string' },
                                to_date: { type: 'string' }
                            },
                            additionalProperties: false
                        }
                    }
                }
            }
        ]
    })
    async count(
        where?: { from_date?: string, to_date?: string }
    ): Promise<any> {
        const { from_date, to_date } = where || {};

        const purchasePayback = await this.purchasePaybackRepositoryGetter();

        // const rawQuery = `select count(*) as count from (select d.vfnr as VFNR, 40 as week, IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23') as cashbackCode, count(pp.id) from purchasepaybacks pp, purchasereceipts pr LEFT OUTER JOIN dealerships d ON pr.dealershipsId = d.id where pp.purchasereceiptsId = pr.id and completed = 1 and (status = \"PAID\" or status = \"APPROVED\" or status = \"PRE-PAYMENT\") and date > \"${from_date || "2023-01-01"}\" and date < \"${to_date || "2024-12-31"}\" group by VFNR, week, cashbackCode) as derived`;
        const rawQuery = `select count(*) as count from (select concat('Räder & Reifen Cashback-Challenge','_','2024','_','Pkw;Van','_',IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23'),'_',d.vfnr,'_',week(pp.approvedDate,1)) as 'Key', 'Räder & Reifen Cashback-Challenge' as Challenge_Name, '' as Challenge_Modul_Teilnahme, '2024' as Jahr, 'Pkw;Van' as Sparte, IF(pp.cashbackType = \"cashback-full\", 'CIE_23', 'COE_23') as Modulcode, d.vfnr as VFNR, week(pp.approvedDate,1) as Challenge_Woche, count(pp.id) as Anzahl from purchasepaybacks pp, purchasereceipts pr LEFT OUTER JOIN dealerships d ON pr.dealershipsId = d.id where pp.purchasereceiptsId = pr.id and pp.completed = 1 and (pp.status = 'PAID' or pp.status = 'APPROVED' or pp.status = 'PRE-PAYMENT') and pp.approvedDate > \"${from_date || "2023-01-01"}\" and pp.approvedDate < \"${to_date || "2024-12-31"}\" group by VFNR, Challenge_Woche, Modulcode) as derived`;
        return (await purchasePayback.execute(rawQuery))[0];
    }
}
