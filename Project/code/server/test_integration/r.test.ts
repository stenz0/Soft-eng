import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
//import { cleanup} from "../src/db/cleanup";
import { Role } from "../src/components/user"

const baseURL = "/ezelectronics"

function cleanup() {
    return new Promise((resolve, reject)=>{
        db.serialize(() => {
            // Delete all data from the database.
            db.run("DELETE FROM users", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
            db.run("DELETE FROM products", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
            db.run("DELETE FROM cart", (err)=>{
                if(err)
                    reject(err)
                resolve(true)
            })
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

const postProduct = async(productInfo: any,cookieInfo: any)=>{
    await request(app)
    .post(baseURL + "/products")
    .set("Cookie",cookieInfo)
    .send(productInfo)
    .expect(200)
}

const logout = async(cookieInfo: any)=>{
    await request(app)
    .delete(baseURL + "/sessions/current")
    .set("Cookie",cookieInfo)
    .expect(200)
}

const addtocart = async(cookieInfo: any)=>{
    await request(app)
    .post(baseURL + "/carts")
    .set("Cookie", cookieInfo)
    .send({model:"testmodel"})
    .expect(200)
}

const makepayment = async(cookieInfo: any)=>{
    await request(app)
    .patch(baseURL + "/carts")
    .set("Cookie", cookieInfo) 
    .expect(200)
}

const makereview = async(cookieInfo: any, reviewInfo: any, productInfo:any)=>{
    await request(app)
    .post(baseURL + "/reviews/" + productInfo.model)
    .set("Cookie", cookieInfo)
    .send(reviewInfo)
    .expect(200)
}

const deletereview = async(cookieInfo: any, productInfo:any)=>{
    await request(app)
    .delete(baseURL + "/reviews/" + productInfo.model)
    .set("Cookie", cookieInfo)
    .send()
    .expect(200)
}

const deletemodelreviews= async(cookieInfo: any, productInfo:any)=>{
    await request(app)
    .delete(baseURL + "/reviews/" + productInfo.model + "/all")
    .set("Cookie", cookieInfo)
    .send()
    .expect(200)
}

const deleteallreviews= async(cookieInfo: any)=>{
    await request(app)
    .delete(baseURL+"/reviews")
    .set("Cookie", cookieInfo)
    .send()
    .expect(200)
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

const testreview = {
    score: 4,
    comment: "testcomment",
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

beforeAll(async ()=>{
    await cleanup();
    //await postUser(testAdmin)
    //AdminCookie = await login(testAdmin)
})

describe("Review integration testing ", ()=>{
    
    describe("scenario 17.1",()=>{
        test("Add a review to a product", async () => {         
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct,ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addtocart(CustomerCookie)
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
            await makereview(CustomerCookie,testreview,testproduct)
        })
    })  
    describe("scenario 17.2",()=>{
        test("delete a review to a product", async () => {  
            await cleanup();       
            await postUser(testManager) 
            ManagerCookie = await login(testManager)  
            await postProduct(testproduct,ManagerCookie)  
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer) 
            await addtocart(CustomerCookie) 
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
            await makereview(CustomerCookie,testreview,testproduct)
            await deletereview(CustomerCookie,testproduct)
        })
    })
    describe("scenario 18.1",()=>{
        test("view reviews", async () => { 
            await cleanup();         
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct,ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addtocart(CustomerCookie)
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
            await makereview(CustomerCookie,testreview,testproduct)
            const getReviewsResponse = await request(app)
                .get(baseURL + "/reviews/" + testproduct.model)
                .set("Cookie", CustomerCookie);
            expect(getReviewsResponse.status).toBe(200);
            expect(getReviewsResponse.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                    model: testproduct.model,
                    user: testCustomer.username,
                    score: testreview.score,
                    comment: testreview.comment,
                    })
                ])
            );
        })
    })
    describe("scenario 19.1",()=>{
        test("Delete all reviews of one product", async () => {
            await cleanup();          
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct,ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addtocart(CustomerCookie)
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
            await makereview(CustomerCookie,testreview,testproduct)
            await postUser(testAdmin)
            AdminCookie = await login(testAdmin)
            await deletemodelreviews(AdminCookie,testproduct)
            const verifyAllDeleteResponse = await request(app)
                .get(baseURL + "/reviews/" + testproduct.model)
                .set("Cookie", AdminCookie);
            expect(verifyAllDeleteResponse.status).toBe(200);
            expect(verifyAllDeleteResponse.body).toEqual([]);
        })
    })
    describe("scenario 19.2",()=>{
        test("Delete all reviews of all products", async () => {
            await cleanup();          
            await postUser(testManager)
            ManagerCookie = await login(testManager)
            await postProduct(testproduct,ManagerCookie)
            await logout(ManagerCookie)
            await postUser(testCustomer)
            CustomerCookie = await login(testCustomer)
            await addtocart(CustomerCookie)
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
            await makereview(CustomerCookie,testreview,testproduct)
            await postUser(testAdmin)
            AdminCookie = await login(testAdmin)
            await deleteallreviews(AdminCookie)
        })
    })
})