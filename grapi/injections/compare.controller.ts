import { repository } from "@loopback/repository";

import { get, param, HttpErrors } from "@loopback/rest";


export class CompareController {
    constructor(
        @repository.getter("PurchasepaybacksRepository")
        protected purchasePaybackRepositoryGetter: () => Promise<any>
    ) { }


    private getQuery = (from_date: string = "2024-01-01", to_date: string = "2024-12-31") => {
        // User-defined variables to control which difference conditions to include
        const includePartsDifferences = true;
        const includeServicesDifferences = true;
        const includeDealershipDifferences = true;

        // Fields for each type
        // const cashbackTypeField = ['pp.cashbackType AS pp_cashbackType', 'prb.cashbackType AS prb_cashbackType'];

        // Include the 'id' field from the purchasepaybacks table
        const idField = 'pp.id AS pp_id';

        // Parts-related fields
        const partsFields = [
            'pr.partsId AS pr_parts_id',
            'prb.partsId AS prb_parts_id',
            `CASE
        WHEN pr.partsId <> prb.partsId
            OR (pr.partsId IS NULL AND prb.partsId IS NOT NULL)
            OR (pr.partsId IS NOT NULL AND prb.partsId IS NULL)
        THEN TRUE ELSE FALSE END AS parts_id_diff`,

            'pr.partsCount AS pr_parts_count',
            'prb.partsCount AS prb_parts_count',
            `CASE
        WHEN pr.partsCount <> prb.partsCount
            OR (pr.partsCount IS NULL AND prb.partsCount IS NOT NULL)
            OR (pr.partsCount IS NOT NULL AND prb.partsCount IS NULL)
        THEN TRUE ELSE FALSE END AS parts_count_diff`,

            'pr.partsIdentified AS pr_parts_identified',
            'prb.partsIdentified AS prb_partsIdentified',
            `CASE
        WHEN pr.partsIdentified <> prb.partsIdentified
            OR (pr.partsIdentified IS NULL AND prb.partsIdentified IS NOT NULL)
            OR (pr.partsIdentified IS NOT NULL AND prb.partsIdentified IS NULL)
        THEN TRUE ELSE FALSE END AS parts_identified_diff`,


        ];

        // Services-related fields (storage and switch)
        const servicesFields = [
            // Storage fields
            'pr.storage AS pr_storage',
            'prb.storage AS prb_storage',
            `CASE
        WHEN pr.storage <> prb.storage
            OR (pr.storage IS NULL AND prb.storage IS NOT NULL)
            OR (pr.storage IS NOT NULL AND prb.storage IS NULL)
        THEN TRUE ELSE FALSE END AS storage_diff`,

            'pr.storageIdentified AS pr_storage_identified',
            'prb.storageIdentified AS prb_storage_identified',
            `CASE
        WHEN pr.storageIdentified <> prb.storageIdentified
            OR (pr.storageIdentified IS NULL AND prb.storageIdentified IS NOT NULL)
            OR (pr.storageIdentified IS NOT NULL AND prb.storageIdentified IS NULL)
        THEN TRUE ELSE FALSE END AS storage_identified_diff`,



            // Switch fields
            'pr.switch AS pr_switch',
            'prb.switch AS prb_switch',
            `CASE
        WHEN pr.switch <> prb.switch
            OR (pr.switch IS NULL AND prb.switch IS NOT NULL)
            OR (pr.switch IS NOT NULL AND prb.switch IS NULL)
        THEN TRUE ELSE FALSE END AS switch_diff`,

            'pr.switchIdentified AS pr_switchIdentified',
            'prb.switchIdentified AS prb_switchIdentified',
            `CASE
        WHEN pr.switchIdentified <> prb.switchIdentified
            OR (pr.switchIdentified IS NULL AND prb.switchIdentified IS NOT NULL)
            OR (pr.switchIdentified IS NOT NULL AND prb.switchIdentified IS NULL)
        THEN TRUE ELSE FALSE END AS switch_identified_diff`,

        ];

        // Dealership-related fields
        const dealershipFields = [
            'pr.dealershipsId AS pr_dealerships_id',
            'prb.dealershipsId AS prb_dealerships_id',
            `CASE
        WHEN pr.dealershipsId <> prb.dealershipsId
            OR (pr.dealershipsId IS NULL AND prb.dealershipsId IS NOT NULL)
            OR (pr.dealershipsId IS NOT NULL AND prb.dealershipsId IS NULL)
        THEN TRUE ELSE FALSE END AS dealerships_id_diff`,

            'pr.dealershipIdentified AS pr_dealership_identified',
            'prb.dealershipIdentified AS prb_dealership_identified',
            `CASE
        WHEN pr.dealershipIdentified <> prb.dealershipIdentified
            OR (pr.dealershipIdentified IS NULL AND prb.dealershipIdentified IS NOT NULL)
            OR (pr.dealershipIdentified IS NOT NULL AND prb.dealershipIdentified IS NULL)
        THEN TRUE ELSE FALSE END AS dealership_identified_diff`,


        ];

        const cashbackTypeFields = [
            'pp.cashbackType AS pp_cashbackType',
            'prb.cashbackType AS prb_cashbackType',
            `CASE
    WHEN pp.cashbackType <> prb.cashbackType
        OR (pp.cashbackType IS NULL AND prb.cashbackType IS NOT NULL)
        OR (pp.cashbackType IS NOT NULL AND prb.cashbackType IS NULL)
    THEN TRUE ELSE FALSE END AS cashbackType_diff`,
        ];

        // Combine all fields into the SELECT clause
        const selectFields = [
            idField,
            ...cashbackTypeFields,
            ...partsFields,
            ...servicesFields,
            ...dealershipFields
        ];

        // Difference conditions for filtering
        const differenceConditions: string[] = [];

        // Add conditions based on user-defined variables

        // Parts-related differences
        if (includePartsDifferences) {
            differenceConditions.push(
                `(pr.partsId <> prb.partsId OR (pr.partsId IS NULL AND prb.partsId IS NOT NULL) OR (pr.partsId IS NOT NULL AND prb.partsId IS NULL))`,
                `(pr.partsCount <> prb.partsCount OR (pr.partsCount IS NULL AND prb.partsCount IS NOT NULL) OR (pr.partsCount IS NOT NULL AND prb.partsCount IS NULL))`,
                `(pr.partsIdentified <> prb.partsIdentified OR (pr.partsIdentified IS NULL AND prb.partsIdentified IS NOT NULL) OR (pr.partsIdentified IS NOT NULL AND prb.partsIdentified IS NULL))`,

            );
        }

        // Services-related differences
        if (includeServicesDifferences) {
            differenceConditions.push(
                `(pr.storage <> prb.storage OR (pr.storage IS NULL AND prb.storage IS NOT NULL) OR (pr.storage IS NOT NULL AND prb.storage IS NULL))`,
                `(pr.storageIdentified <> prb.storageIdentified OR (pr.storageIdentified IS NULL AND prb.storageIdentified IS NOT NULL) OR (pr.storageIdentified IS NOT NULL AND prb.storageIdentified IS NULL))`,
                `(pr.storageOverride <> prb.storageOverride OR (pr.storageOverride IS NULL AND prb.storageOverride IS NOT NULL) OR (pr.storageOverride IS NOT NULL AND prb.storageOverride IS NULL))`,
                `(pr.switch <> prb.switch OR (pr.switch IS NULL AND prb.switch IS NOT NULL) OR (pr.switch IS NOT NULL AND prb.switch IS NULL))`,
                `(pr.switchIdentified <> prb.switchIdentified OR (pr.switchIdentified IS NULL AND prb.switchIdentified IS NOT NULL) OR (pr.switchIdentified IS NOT NULL AND prb.switchIdentified IS NULL))`,

            );
        }

        // Dealership-related differences
        if (includeDealershipDifferences) {
            differenceConditions.push(
                `(pr.dealershipsId <> prb.dealershipsId OR (pr.dealershipsId IS NULL AND prb.dealershipsId IS NOT NULL) OR (pr.dealershipsId IS NOT NULL AND prb.dealershipsId IS NULL))`,
                `(pr.dealershipIdentified <> prb.dealershipIdentified OR (pr.dealershipIdentified IS NULL AND prb.dealershipIdentified IS NOT NULL) OR (pr.dealershipIdentified IS NOT NULL AND prb.dealershipIdentified IS NULL))`,

            );
        }
        differenceConditions.push(
            `(pp.cashbackType <> prb.cashbackType OR (pp.cashbackType IS NULL AND prb.cashbackType IS NOT NULL) OR (pp.cashbackType IS NOT NULL AND prb.cashbackType IS NULL))`
        );


        // Construct the WHERE clause
        const whereConditions: string[] = [];

        // Add the date filter condition
        whereConditions.push(`pp.approvedDate BETWEEN '${from_date}' AND '${to_date}'`);
        whereConditions.push(`prb.excludeReason IS NULL`);

        // Add difference conditions if any
        if (differenceConditions.length > 0) {
            whereConditions.push(`(${differenceConditions.join(' OR\n    ')})`);
        }

        // Build the WHERE clause
        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = `
    WHERE
        ${whereConditions.join(' AND\n    ')}
    `;
        }

        // Assemble the complete SQL query using template literals
        const sqlQuery = `
SELECT
    ${selectFields.join(',\n    ')}
FROM
    mbdpp.purchasepaybacks AS pp
JOIN
    mbdpp.purchasereceipts AS pr ON pp.purchasereceiptsId = pr.id
JOIN
    mbdpp.purchasereceipts_backup AS prb ON prb.original_purchasereceipt_id = pr.id
${whereClause};
`;

        const countQuery = `
SELECT COUNT(*) AS count
FROM
    mbdpp.purchasepaybacks AS pp
JOIN
    mbdpp.purchasereceipts AS pr ON pp.purchasereceiptsId = pr.id
JOIN
    mbdpp.purchasereceipts_backup AS prb ON prb.original_purchasereceipt_id = pr.id
${whereClause};
`;

        // Output the SQL query
        console.log(sqlQuery, countQuery);

        return { sqlQuery, countQuery };
    }


    @get('compare/find', {
        responses: {
            '200': {
                description: 'Array of Compare instances',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {

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

        const response = await purchasePayback.execute(this.getQuery(from_date, to_date).sqlQuery)
        // const countResponse = await purchasePayback.execute(this.getQuery(from_date, to_date).countQuery)

        // console.log({ response, countResponse });

        return response;
    }


    @get('compare/count', {
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

        // const response = await purchasePayback.execute(this.getQuery(from_date, to_date).sqlQuery)
        const countResponse = await purchasePayback.execute(this.getQuery(from_date, to_date).countQuery)

        console.log({ countResponse });

        return countResponse[0];
    }
}