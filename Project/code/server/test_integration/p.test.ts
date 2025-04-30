import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { Role } from "../src/components/user"
import { Category, Product } from "../src/components/product"

const baseURL = "/ezelectronics"

function cleanup() {
    return new Promise((resolve, reject)=>{
        db.serialize(() => {
            db.run("DELETE FROM users")
            db.run("DELETE FROM products")
            db.run("DELETE FROM cart")
            db.run("DELETE FROM reviews", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
        })
    })
}

function productCleanup() {
    return new Promise((resolve, reject)=>{
        db.serialize(() => {
            db.run("DELETE FROM products", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
        })
    })
}

const postUser = async(userInfo: any)=>{
    await request(app)
    .post(baseURL + "/users")
    .send(userInfo)
    .expect(200)
}

const login = async(userInfo: any)=>{
    return new Promise<string>((resolve, reject)=>{
        request(app)
        .post(baseURL + "/sessions")
        .send(userInfo)
        .expect(200)
        .end((err, res)=>{
            if(err){
                reject(err)
            }
            resolve(res.header["set-cookie"][0])
        })
    })
}

const insertTheProduct = async (product : Product, PersonCookie : string) => {
    await request(app)
        .post(`${baseURL}/products`)
        .set({"Cookie" : PersonCookie})
        .send(product)
}

const testManager = {
    username: "testManagerUsername",
    name: "testManagerName",
    surname: "testManagerSurname",
    password: "testManagerPassword",
    role: Role.MANAGER,
    address: "testManagerAddress",
    birthdate: "testManagerBirthdate"
}

const testCustomer = {
    username: "testCustomerUsername",
    name: "testCustomerName",
    surname: "testCustomerSurname",
    password: "testCustomerPassword",
    role: Role.CUSTOMER,
    address: "testCustomerAddress",
    birthdate: "testCustomerBirthdate"
}

const Okproduct = {
    sellingPrice: 100,
    model: "testmodel",
    category: Category.SMARTPHONE,
    arrivalDate: "2024-01-01",
    details: "testdetails",
    quantity: 100,
};

const Okproduct2 = {
    sellingPrice: 200,
    model: "testmodel2",
    category: Category.SMARTPHONE,
    arrivalDate: "2024-01-02",
    details: "testdetails2",
    quantity: 102,
};

const lowProduct = {
    sellingPrice: 300,
    model: "testmodel3",
    category: Category.APPLIANCE,
    arrivalDate: "2024-03-03",
    details: "testdetails",
    quantity: 4,
}

const emptyProduct1 = {
    sellingPrice: 400,
    model: "testmodel4",
    category: Category.LAPTOP,
    arrivalDate: "2024-04-04",
    details: "testdetails",
    quantity: 1,
}

const emptyProduct = {
    sellingPrice: 400,
    model: "testmodel4",
    category: Category.LAPTOP,
    arrivalDate: "2024-04-04",
    details: "testdetails",
    quantity: 0,
}

let ManagerCookie : string;
let CustomerCookie : string;
let sellQuantity = 50
let addQuantity = 500

beforeAll(async ()=>{
    await cleanup();
    await postUser(testCustomer)
    await postUser(testManager)
    CustomerCookie = await login(testCustomer)
    ManagerCookie = await login(testManager)
})

afterAll(async () => {
    cleanup()
})

describe("Product routes integration tests", () => {

    describe("POST /products", () => {
        test("It should return a 200 success code", async () => {
            // The manager insert a new product model in the db
            await insertTheProduct(Okproduct, ManagerCookie)

            // The response status = 200 means the product is in the database
            let response = await request(app)
            .get(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);
            expect(response.body).toHaveLength(1);

            let tprod = response.body.find((tprod : any) => tprod.model = Okproduct.model);
            expect(tprod.model).toBe(Okproduct.model);
            expect(tprod.sellingPrice).toBe(Okproduct.sellingPrice);
        })

        test("It should return a 401 error - Unauthorized", async () => {
            await request(app)
            .post(`${baseURL}/products`)
            .set({"Cookie" : CustomerCookie})
            .send(Okproduct)
            .expect(401);
        })

        test("It should return a 400 error - AfterCurrentDateError", async () => {
            await request(app)
            .post(`${baseURL}/products`)
            .set({"Cookie" : ManagerCookie})
            .send({sellingPrice : Okproduct2.sellingPrice, 
                model : Okproduct2.model, 
                category : Okproduct2.category, 
                details : Okproduct2.details, 
                quantity : Okproduct2.quantity, 
                arrivalDate : "2100-01-01"})
            .expect(400);   
        })

        test("It should return a 409 error - ProductAlreadyExistsError", async () => {
            await request(app)
            .post(`${baseURL}/products`)
            .set({"Cookie" : ManagerCookie})
            .send(Okproduct)
            .expect(409);
        })
    })

    describe("PATCH products/:model", () => {

        test("It should return a 200 success code", async () => {

            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : addQuantity, changeDate: Okproduct.arrivalDate})
            .expect(200);

            Okproduct.quantity += addQuantity

            let response = await request(app)
            .get(`${baseURL}/products`)
            .set({"Cookie" : ManagerCookie})
            .expect(200);
            expect(response.body).toHaveLength(1);

            expect(response.body[0].quantity).toBe(Okproduct.quantity);
        })

        test("It should return 401 error code - Unathorized", async () => {

            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}`)
            .set({"Cookie" : CustomerCookie})
            .send({model: Okproduct.model, quantity : addQuantity, arrivalDate: Okproduct.arrivalDate})
            .expect(401);
        })

        test("It should return a 400 error code - AfterCurrentDateError", async () => {
            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}`)
            .set({"Cookie" : ManagerCookie})
            .send({quantity : addQuantity, changeDate: "2051-01-01"})
            .expect(400);
        })

        test("It should return a 404 error code", async () => {
            await request(app)
            .patch(`${baseURL}/products/ciao/invalidator"`)
            .set({"Cookie" : ManagerCookie})
            .send({model: "ciao", quantity : addQuantity, arrivalDate: ""})
            .expect(404);
        })

        test("It should return a 400 error code - New arrivalDate before old arrivalDate ", async () => {

            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : addQuantity, changeDate: "2000/01/01"})
            .expect(400);
        })
            
    })

    describe("PATCH products/:model/sell", () => {

        test("It should return a 200 success code and decrease quantity", async () => {

            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : sellQuantity, changeDate: Okproduct.arrivalDate})
            .expect(200);

            Okproduct.quantity -= sellQuantity

            let response = await request(app)
            .get(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].quantity).toBe(Okproduct.quantity);
        })

        test("It should return a 400 error code - AfterCurrentDateError", async () => {
            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : sellQuantity, sellingDate: "2050-01-01"})
            .expect(400);
        })
        

        test("It should return a 400 error code - BeforeArrivalDateError", async () => {
            await insertTheProduct(Okproduct, ManagerCookie)

            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : sellQuantity, sellingDate: "2000-01-01"})
            .expect(400);
        })

        test("It should return a 404 error code - ProductNotFoundError", async () => {
            await request(app)
            .patch(`${baseURL}/products/ciao/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: "ciao", quantity : sellQuantity, changeDate: ""})
            .expect(404);
        })

        test("It should return a 409 error code - LowProductStockError", async() => {
            await insertTheProduct(lowProduct, ManagerCookie)

            await request(app)
            .patch(`${baseURL}/products/${lowProduct.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: lowProduct.model, quantity : sellQuantity, changeDate: lowProduct.arrivalDate})
            .expect(409);
        })

        test("It should return a 409 error code - EmptyProductStockError", async() => {
            await insertTheProduct(emptyProduct1, ManagerCookie)

            await request(app)
            .patch(`${baseURL}/products/${emptyProduct1.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: Okproduct.model, quantity : 1, changeDate: emptyProduct1.arrivalDate})
            .expect(200);

            await request(app)
            .patch(`${baseURL}/products/${emptyProduct.model}/sell`)
            .set({"Cookie" : ManagerCookie})
            .send({model: emptyProduct.model, quantity : sellQuantity, changeDate: emptyProduct.arrivalDate})
            .expect(409);
            
        }) 

        test("It should return 401 error code - Unauthorized", async () => {
            await request(app)
            .patch(`${baseURL}/products/${Okproduct.model}/sell`)
            .set({"Cookie" : CustomerCookie})
            .send({model: Okproduct.model, quantity : sellQuantity, changeDate: Okproduct.arrivalDate})
            .expect(401);
        })
    })

    describe("GET /products",() => {

        test("It should return a 200 success code and the products", async() => {
            await insertTheProduct(Okproduct2, ManagerCookie)

            let response = await request(app)
            .get(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);
            
            expect(response.body).toEqual([Okproduct, lowProduct, emptyProduct, Okproduct2]);
        });

        test("It should return a 200 success code and all the Smartphones", async() => {

            let response = await request(app)
            .get(`${baseURL}/products?grouping=category&category=Smartphone`)
            .set("Cookie", ManagerCookie)
            .expect(200)

            expect(response.body).toEqual(([Okproduct, Okproduct2]));

        })

        test("It should return a 200 success code and the product", async() => {

            let response = await request(app)
            .get(`${baseURL}/products?grouping=model&model=testmodel`)
            .set("Cookie", ManagerCookie)
            .expect(200)
            expect(response.body).toEqual(([Okproduct]));
        })

        test ("It should return a 422 error code - grouping = model but category is not null", async() => {

            await request(app)
            .get(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .query({grouping : "model", category : Category.SMARTPHONE, model : "testmodel"})
            .expect(422);
        })
       

        test ("It should return a 422 error code - grouping = category but category is null", async() => {
            
            await request(app)
            .get(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .query({grouping : "category", category : null, model : null})
            .expect(422);
            
        })

        

        test ("It should return a 404 error code ", async() => {

            await request(app)
            .get(`${baseURL}/products?grouping=model&model=Ciao`)
            .set("Cookie", ManagerCookie)
            .expect(404)
            
        })

        test("It should return 401 error code - Unathorized", async() => {
            
            await request(app)
            .get(`${baseURL}/products?grouping=category&category=Smartphone`)
            .set("Cookie", CustomerCookie).expect(401)

        })
    })

    describe("GET /products/available", () => {

        test("It should return a 200 success code and all the available Smartphone products", async() => {

            let response = await request(app).get(`${baseURL}/products?grouping=category&category=Smartphone`).set("Cookie", ManagerCookie).expect(200)

            expect(response.body).toEqual([Okproduct, Okproduct2]);


        })

        test("It should return a 200 success code and testmodel", async() => {

            let response = await request(app).get(`${baseURL}/products?grouping=model&model=testmodel`).set("Cookie", ManagerCookie).expect(200)

            expect(response.body).toEqual([Okproduct]);
        })

        test ("It should return a 422 error code - grouping = category but category is null", async() => {
            await request(app)
            .get(`${baseURL}/products/available`)
            .set({'Cookie' : CustomerCookie})
            .query({grouping : "category", category : null, model : "testmodel"})
            .expect(422);
        })

        test ("It should return a 404 error code ", async() => {

            await request(app)
            .get(`${baseURL}/products?grouping=model&model=Ciao`).set("Cookie", ManagerCookie)
            .expect(404)
            
        })
    })

    describe("DELETE /products/:model", () => {
        
        test("It should return a 200 success code and delete okproduct", async()=>{
            await request(app)
            .delete(`${baseURL}/products/${Okproduct.model}`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);

            let response = await request(app)
            .get(`${baseURL}/products/`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);
            expect(response.body).toEqual([lowProduct, emptyProduct, Okproduct2]);
        })

        test("It should return a 404 error code", async()=>{
            await request(app)
            .delete(`${baseURL}/products/ciao`)
            .set({'Cookie' : ManagerCookie})
            .expect(404);
        })

        test("It should return 401 error code - Unathorized", async()=>{
            await request(app)
            .delete(`${baseURL}/products/${Okproduct2}`)
            .set({'Cookie' : CustomerCookie})
            .expect(401);
        })
    })

    describe("DELETE /products", () => {
        test("It should return a 200 ok code and delete all products in the database", async() => {
            await request(app)
            .delete(`${baseURL}/products`)
            .set({'Cookie' : ManagerCookie})
            .expect(200);
        })

        test("It should return 401 error code - Unathorized", async() => {
            await request(app)
            .delete(`${baseURL}/products`)
            .set({'Cookie' : CustomerCookie})
            .expect(401);
        })
    })
        
})