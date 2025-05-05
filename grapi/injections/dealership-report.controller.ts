import { repository } from "@loopback/repository";

import { get, param, HttpErrors } from "@loopback/rest";

export class DealershipReportController {
    constructor(
        @repository.getter("PurchasepaybacksRepository")
        protected purchasePaybackRepositoryGetter: () => Promise<any>
    ) { }

    private getQuery = (
        from_date: string = "2024-01-01",
        to_date: string = "2024-12-31",
        vfnrFilter: string[] | null = null,
        vfnrhbFilter: string[] | null = null,
        limit: number | null = 10,
        offset: number | null = 0
    ) => {

        // Function to format dates to 'YYYY-MM-DD HH:MM:SS'
        function formatDate(date: Date): string {
            return date.toISOString().slice(0, 19).replace("T", " ");
        }

        // Function to escape single quotes and backslashes in strings
        function escapeString(value: string): string {
            return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                switch (char) {
                    case "\0":
                        return "\\0";
                    case "\x08":
                        return "\\b";
                    case "\x09":
                        return "\\t";
                    case "\x1a":
                        return "\\z";
                    case "\n":
                        return "\\n";
                    case "\r":
                        return "\\r";
                    case "\"":
                    case "'":
                    case "\\":
                    case "%":
                        return "\\" + char; // Prepends a backslash to backslash, percent,
                    // and double/single quotes
                    default:
                        return char;
                }
            });
        }

        const fromDate = formatDate(new Date(from_date));
        const toDate = formatDate(new Date(to_date));

        // Sanitize and escape date inputs
        const safeFromDate = escapeString(fromDate);
        const safeToDate = escapeString(toDate);

        // Fields to select
        const selectFields = [
            "pp.id AS pp_id",
            "pr.id AS pr_id",

            // Dealership information from dealerships table (d)
            "d.Name AS dealership_name",
            "d.Strasse AS dealership_street",
            "d.PLZ AS dealership_postal_code",
            "d.Ort AS dealership_city",
            "d.VFNR AS dealership_VFNR",
            "d.VFNRHB AS dealership_VFNRHB",
            "d.Betriebsart AS dealership_type",
            // Add other dealership fields as needed
        ];

        // Build the WHERE clause with date filter
        const whereConditions: string[] = [];

        // Add date filter
        whereConditions.push(`pp.date BETWEEN '${safeFromDate}' AND '${safeToDate}'`);

        // Add VFNR filter if provided
        if (Array.isArray(vfnrFilter) && vfnrFilter.length > 0) {
            // Sanitize and escape each value in the array
            const safeVfnrFilter = vfnrFilter.map(value => `'${escapeString(value)}'`);
            whereConditions.push(`d.VFNR IN (${safeVfnrFilter.join(", ")})`);
        }

        // Add VFNRHB filter if provided
        if (Array.isArray(vfnrhbFilter) && vfnrhbFilter.length > 0) {
            // Sanitize and escape each value in the array
            const safeVfnrhbFilter = vfnrhbFilter.map(value => `'${escapeString(value)}'`);
            whereConditions.push(`d.VFNRHB IN (${safeVfnrhbFilter.join(", ")})`);
        }

        // Build the WHERE clause
        let whereClause = "";
        if (whereConditions.length > 0) {
            whereClause = `
WHERE
    ${whereConditions.join(" AND\n    ")}
`;
        }

        // Build the LIMIT and OFFSET clause
        let limitOffsetClause = "";
        if (limit !== null && offset !== null) {
            limitOffsetClause = `
LIMIT ${limit} OFFSET ${offset}
`;
        } else if (limit !== null) {
            limitOffsetClause = `
LIMIT ${limit}
`;
        }

        // Assemble the complete SQL query using template literals
        const sqlQuery = `
SELECT
    ${selectFields.join(",\n    ")}
FROM
    purchasepaybacks AS pp
JOIN
    purchasereceipts AS pr ON pp.purchasereceiptsId = pr.id
LEFT JOIN
    dealerships AS d ON pr.dealershipsId = d.id
${whereClause}
${limitOffsetClause};
`;

        // Build the COUNT query (without LIMIT and OFFSET)
        const countQuery = `
SELECT COUNT(*) AS total_records
FROM
    purchasepaybacks AS pp
JOIN
    purchasereceipts AS pr ON pp.purchasereceiptsId = pr.id
LEFT JOIN
    dealerships AS d ON pr.dealershipsId = d.id
${whereClause};
`;

        // Output the SQL queries
        console.log("Main SQL Query:");
        console.log(sqlQuery);

        console.log("Count SQL Query:");
        console.log(countQuery);

        return { sqlQuery, countQuery };
    };

    @get("dealership-report/find", {
        responses: {
            "200": {
                description: "Array of Dealership Report instances",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {},
                            },
                        },
                    },
                },
            },
        },
        parameters: [
            {
                name: "filter",
                in: "query",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                where: {
                                    type: "object",
                                    properties: {
                                        from_date: { type: "string" },
                                        to_date: { type: "string" },
                                        vfnrFilter: { type: "string" },
                                        vfnrhbFilter: { type: "string" },
                                    },
                                    additionalProperties: false,
                                },
                                limit: { type: "number" },
                                offset: { type: "number" },
                            },
                        },
                    },
                },
            },
        ],
    })
    async find(
        // infer from the parameters above
        filter?: { where?: { from_date?: string; to_date?: string; vfnrFilter?: string; vfnrhbFilter?: string; }, limit?: number; offset?: number }
    ): Promise<any> {
        const { from_date, to_date, vfnrFilter, vfnrhbFilter } = filter?.where || {};

        const { limit, offset } = filter || {};

        const purchasePayback = await this.purchasePaybackRepositoryGetter();

        const response = await purchasePayback.execute(
            this.getQuery(from_date, to_date, vfnrFilter?.split(","), vfnrhbFilter?.split(","), limit, offset).sqlQuery
        );


        return response;
    }

    @get("dealership-report/count", {
        responses: {
            "200": {
                description: "Successfully executes the query.",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                count: { type: "number" },
                            },
                        },
                    },
                },
            },
        },
        parameters: [
            {
                name: "where",
                in: "query",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                from_date: { type: "string" },
                                to_date: { type: "string" },
                                vfnrFilter: { type: "string" },
                                vfnrhbFilter: { type: "string" },
                                limit: { type: "number" },
                                offset: { type: "number" },
                            },
                            additionalProperties: false,
                        },
                    },
                },
            },
        ],
    })
    async count(where?: { from_date?: string; to_date?: string; vfnrFilter?: string; vfnrhbFilter?: string; limit?: number; offset?: number }): Promise<any> {
        const { from_date, to_date, vfnrFilter, vfnrhbFilter, limit, offset } = where || {};

        const purchasePayback = await this.purchasePaybackRepositoryGetter();

        // const response = await purchasePayback.execute(this.getQuery(from_date, to_date).sqlQuery)
        const countResponse = await purchasePayback.execute(
            this.getQuery(from_date, to_date, vfnrFilter?.split(","), vfnrhbFilter?.split(","), limit, offset).countQuery
        );

        console.log({ countResponse });

        return {
            count: countResponse[0].total_records
        }

    }
}
