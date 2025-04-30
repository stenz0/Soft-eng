import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { User, Role } from "../src/components/user"
import { Category, Product } from "../src/components/product"
import { Cart, ProductInCart } from "../src/components/cart"
import dayjs from "dayjs"


const baseURL = "/ezelectronics"

function cleanup() {
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


const postProduct = async (productInfo: any, cookieInfo: any) => {
    await request(app)
        .post(baseURL + "/products")
        .set("Cookie", cookieInfo)
        .send(productInfo)
        .expect(200)
}

const logout = async (cookieInfo: any) => {
    await request(app)
        .delete(baseURL + "/sessions/current")
        .set("Cookie", cookieInfo)
        .expect(200)
}

const addToCart = async (model: string, cookieInfo: any) => {
    await request(app)
                .post(baseURL + "/carts")
                .set("Cookie", cookieInfo)
                .send({model: model})
                .expect(200)
}

const removeFormCart = async (model:string, cookieInfo: any) => {
    await request(app)
        .delete(baseURL + "/carts/products/"+model)
        .set("Cookie", cookieInfo)
        .expect(200)
}

const makepayment = async (cookieInfo: any) => {
    await request(app)
        .patch(baseURL + "/carts")
        .set("Cookie", cookieInfo)
        .expect(200)
}

const getCurrentCart = async(cookieInfo: any) => {
    const {body} = await request(app)
        .get(baseURL + "/carts")
        .set("Cookie", cookieInfo)
        .expect(200)
    return body
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

const testproduct = {
    sellingPrice: 100,
    model: "testmodel",
    category: "Laptop",
    arrivalDate: "2024-06-12",
    details: "testdetails",
    quantity: 4,
};

const testCustomer = {
    username: "testCustomerUsername",
    name: "testCustomerName",
    surname: "testCustomerSurname",
    password: "testCustomerPassword",
    role: Role.CUSTOMER,
    address: "testCustomerAddress",
    birthdate: "testCustomerBirthdate"
}



const testAdmin = {
    username: "testAdminUsername",
    name: "testAdminName",
    surname: "testAdminSurname",
    password: "testAdminPassword",
    role: Role.ADMIN,
    address: "testAdminAddress",
    birthdate: "testAdminBirthdate"
}

let ManagerCookie = ""
let CustomerCookie = ""
let AdminCookie = ""

beforeAll(async () => {
    await cleanup();
    await postUser(testCustomer)
    await postUser(testManager)
    await postUser(testAdmin)
    CustomerCookie = await login(testCustomer)
    ManagerCookie = await login(testManager)
    AdminCookie = await login(testAdmin)
    await postProduct(testproduct, ManagerCookie)
    
    
})

describe("Cart integration testing ", () => {
    describe("POST /carts", ()=>{
        test("create and add product, should resolve to 200",async()=>{
            const actCart = await getCurrentCart(CustomerCookie)
            expect(actCart).toEqual(new Cart(testCustomer.username,false,null as any,0,[]))

            await request(app)
                .post(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .send({model: testproduct.model})
                .expect(200)

            const newCart = await getCurrentCart(CustomerCookie)

            const testCart = {customer: testCustomer.username,
                        paid:0,
                        paymentDate: null as any,
                        total: testproduct.sellingPrice,
                        products: [{model: testproduct.model,
                                     quantity: 1, 
                                     category: testproduct.category as Category,price: 
                                     testproduct.sellingPrice}]}

            expect(newCart).toEqual(testCart)
            
        })

        test("try to add a non existing product, should resolve to 404",async()=>{

            await request(app)
                .post(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .send({model: "fake_model"})
                .expect(404)
            
        })

        test("try to add a non avaiable product, should resolve to 409",async()=>{

            const notAva = {...testproduct, model:"notAv", quantity: 0}
            await postProduct(notAva, ManagerCookie)

            await request(app)
                .post(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .send({model: "notAv"})
                .expect(409)
            
        })
    })

    describe("GET /carts", ()=>{
        test("View information of the current cart, should resolve 200 ",async()=>{
            const newCart = await getCurrentCart(CustomerCookie)

            const testCart = {customer: testCustomer.username,
                paid:0,
                paymentDate: null as any,
                total: testproduct.sellingPrice,
                products: [{model: testproduct.model,
                             quantity: 1, 
                             category: testproduct.category as Category,price: 
                             testproduct.sellingPrice}]}

            expect(newCart).toEqual(testCart)
        })
    })

    describe("GET /carts/all", ()=>{
        test("View information of the current cart, should resolve 200 ",async()=>{
            const {body} = await request(app)
            .get(baseURL + "/carts/all")
        .set("Cookie", AdminCookie)
        .expect(200)

            const testCart = {customer: testCustomer.username,
                paid:0,
                paymentDate: null as any,
                total: testproduct.sellingPrice,
                products: [{model: testproduct.model,
                             quantity: 1, 
                             category: testproduct.category as Category,price: 
                             testproduct.sellingPrice}]}

            expect(body).toEqual([testCart])
        })
    })

    

    describe("DELETE /carts/products/:model", ()=>{
        test("Try to remove a non present product, should reject 404", async()=>{
            await request(app)
            .delete(baseURL + "/carts/products/"+"notAv")
            .set("Cookie", CustomerCookie)
            .expect(404)
        })

        test("Try to remove a non existent product, should reject 404", async()=>{
            await request(app)
            .delete(baseURL + "/carts/products/"+"notExist")
            .set("Cookie", CustomerCookie)
            .expect(404)
        })

        test("Try to remove a product, should resolve 200", async()=>{
            await request(app)
            .delete(baseURL + "/carts/products/"+testproduct.model)
            .set("Cookie", CustomerCookie)
            .expect(200)
        })
    })

    describe("PATCH /carts", ()=>{
        test("try to pay empty cart, should resolve 400", async()=>{
            await request(app)
                .patch(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .expect(400)
        })

        test("pay for the current cart, should resolve 200", async()=>{
            await addToCart(testproduct.model, CustomerCookie)
            await request(app)
                .patch(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .expect(200)
        })

        test("try to pay non existent cart, should resolve 404", async()=>{
            await request(app)
                .patch(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .expect(404)
        })
    })

    describe("GET /carts/history", ()=>{
        test("get cart history, should resolve 200 ",async()=>{
            const {body} = await request(app)
            .get(baseURL + "/carts/history")
        .set("Cookie", CustomerCookie)
        .expect(200)

            const testCart = {customer: testCustomer.username,
                paid:1,
                paymentDate: dayjs().format("YYYY-MM-DD"),
                total: testproduct.sellingPrice,
                products: [{model: testproduct.model,
                             quantity: 1, 
                             category: testproduct.category as Category,price: 
                             testproduct.sellingPrice}]}

            expect(body).toEqual([testCart])
        })
    })

    describe("DELETE /carts/products/:model", ()=>{
        test("Try to remove a product from a non existing cart, should reject 404", async()=>{
            await request(app)
            .delete(baseURL + "/carts/products/"+testproduct.model)
            .set("Cookie", CustomerCookie)
            .expect(404)
        })
    })

    describe("DELETE /carts/current", ()=>{
        test("delete current cart, should resolve 200", async()=>{
            await addToCart(testproduct.model, CustomerCookie)

            await request(app)
            .delete(baseURL + "/carts/current")
            .set("Cookie", CustomerCookie)
            .expect(200)
        })

        test("try to delete an non existing current, should reject 404", async()=>{
            await addToCart(testproduct.model, CustomerCookie)
            await request(app)
                .patch(baseURL + "/carts")
                .set("Cookie", CustomerCookie)
                .expect(200)

                await request(app)
                .delete(baseURL + "/carts/current")
                .set("Cookie", CustomerCookie)
                .expect(404)
            
        })
    })

    describe("DELETE /carts", ()=>{
        test("delete current cart, should resolve 200", async()=>{
            await request(app)
            .delete(baseURL + "/carts")
            .set("Cookie", AdminCookie)
            .expect(200)
        })
    })

    describe("scenario 10.3", () => {
        test("Add a product to the cart", async () => {
            await cleanup()
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct, ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addToCart("testmodel",CustomerCookie)
            const cartResponse = await request(app)
                .get(baseURL + "/carts")
                .set("Cookie", CustomerCookie);
            expect(cartResponse.status).toBe(200);
            expect(cartResponse.body.products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: "testmodel"
                    })
                ])
            );
        })
    })

    describe("scenario 10.6", () => {
        test("Pay for the current cart", async () => {
            await cleanup();
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct, ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addToCart("testmodel",CustomerCookie)
            const cartResponse = await request(app)
                .get(baseURL + "/carts")
                .set("Cookie", CustomerCookie);
            expect(cartResponse.status).toBe(200);
            expect(cartResponse.body.products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: "testmodel"
                    })
                ])
            );
            await makepayment(CustomerCookie)
        })
    })

    describe("scenario 10.1", () => {
        test("View information of the current cart", async () => {
            await cleanup();
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct, ManagerCookie)
            await logout(ManagerCookie)

            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            
            await addToCart("testmodel",CustomerCookie)
            const cartResponse = await request(app)
                .get(baseURL + "/carts")
                .set("Cookie", CustomerCookie);
            expect(cartResponse.status).toBe(200);
            expect(cartResponse.body.products).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        model: "testmodel"
                    })
                ])
            );
        })
    })

})
