"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    return new Promise((resolve, reject)=>{
        db.serialize(() => {
            db.run("DELETE FROM cart")
            db.run("DELETE FROM products")
            db.run("DELETE FROM users")
            db.run("DELETE FROM reviews", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
        })
    })
}
    

   