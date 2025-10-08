import { NextRequest, NextResponse } from "next/server";
import { config } from "@/db/dbconfig";
const sql = require("mssql");

export const dynamic = "force-dynamic";

export const GET = async () => {
  const pool = await sql.connect(config);

  try {
    const result = await pool.request().query(`
        SELECT 
            DATEPART(YEAR, TIME_HOURLY) AS [Year],
            DATEPART(MONTH, TIME_HOURLY) AS [Month],
            DATEPART(DAY, TIME_HOURLY) AS [Day],
            DATEPART(HOUR, TIME_HOURLY) AS [Hour],
            SOLAR_TOTAL_KWH,
            SOLAR_TOTAL_KW,
            TIME_HOURLY
        FROM 
            Solar_time_report
        WHERE 
            TIME_HOURLY IN (
                SELECT 
                    MIN(TIME_HOURLY) 
                FROM 
                    Solar_time_report 
                GROUP BY 
                    DATEPART(YEAR, TIME_HOURLY),
                    DATEPART(MONTH, TIME_HOURLY),
                    DATEPART(DAY, TIME_HOURLY),
                    DATEPART(HOUR, TIME_HOURLY)
            )
        ORDER BY 
            [Year], [Month], [Day], [Hour];
        
        `);
    // console.log(result.recordset); // Log the data to the console

    return NextResponse.json({ data: result.recordset }); // Send the data in the response
  } catch (error) {
    console.log("Error querying data: ", error);
    return NextResponse.json({ error: "Error querying data" });
  }
};
