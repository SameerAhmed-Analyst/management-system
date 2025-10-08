import { NextRequest, NextResponse } from "next/server";
import { config } from "@/db/dbconfig";
const sql = require('mssql');

export const dynamic = 'force-dynamic';

export const GET = async () => {
    const poolPromise = sql.connect(config);

    try {
        const pool = await poolPromise;

        // Run all queries in parallel using Promise.all
        const [result1, result2, result3, result4, result5] = await Promise.all([
            pool.request().query('SELECT * FROM OVERVIEW'),
            pool.request().query('SELECT powerhouse1gen, powerhouse2gen, powerhouse3gen, AM17_PH2, totalpowergen, steamph1, steamph2, steamph3, steamph4, cb, steamgen FROM dashboard'),
            pool.request().query('SELECT MAN_KW, MAK1_KW, MAK2_KW FROM powerhouse3'),
            pool.request().query('SELECT turbinekw FROM powerhouse2'),
            pool.request().query('SELECT engine6kw, engine7kw FROM powerhouse1')
        ]);

        // Combine results
        const combinedResults = {
            overview: result1.recordset,
            dashboard: result2.recordset,
            powerhouse3: result3.recordset,
            powerhouse2: result4.recordset,
            powerhouse1: result5.recordset
        };

        // Return the combined results as JSON
        return NextResponse.json({ data: combinedResults });

    } catch (error) {
        console.error("Error querying data: ", error);
        return NextResponse.json({ error: "Error querying data" });
    }
};
