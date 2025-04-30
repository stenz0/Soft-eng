import {describe, test, expect, jest,beforeEach, afterEach } from "@jest/globals"
import request from "supertest"
import { app } from "../../index"
import {Role, User} from "../../src/components/user"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import { ProductNotFoundError,ProductAlreadyExistsError, ProductSoldError,EmptyProductStockError,LowProductStockError} from "../../src/errors/productError";
import { Category, Product } from "../../src/components/product"
import ProductController from "../../src/controllers/productController"
import {DateError} from "../../src/utilities"

const baseURL = "/ezelectronics"
jest.mock("../../src/routers/auth")

const dummyMiddleware = (req: any, res: any, next: any) => next()

beforeEach(()=>{
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.restoreAllMocks(
    )
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation(dummyMiddleware)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation(dummyMiddleware)
})

afterEach(()=>{
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.resetAllMocks()
})

const testproduct1 = new Product(1000, "telephone", Category.SMARTPHONE, "2022-01-01", "", 30);
const testproduct2 = {sellingPrice: 1000, model: "telephone", category: Category.SMARTPHONE, arrivalDate: "2030-01-01", details: "", quantity: 30};
const testproduct3 = {sellingPrice: 1000, model: "telephone3", category: Category.SMARTPHONE, arrivalDate: "2030-01-01", details: "", quantity: 0};
const testproduct4 = {sellingPrice: 1000, model: "telephone4", category: Category.SMARTPHONE, arrivalDate: "2030-01-01", details: "", quantity: 2};
let testproduct = [testproduct1, testproduct2, testproduct3, testproduct4]

class Error422 extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = "Invalid parameters"
        this.customCode = 422
    }
}

describe("Route tests product", () => {
    describe("POST /products", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce() 

            const response = await request(app).post(baseURL + "/products").send(testproduct[0]).expect(200)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
        })

        test("It should return a 409 error code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new ProductAlreadyExistsError())

            const response = await request(app).post(baseURL + "/products").send(testproduct[0]).expect(409) 
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
        })

        test("It should return a 400 error code", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new DateError())

            const response = await request(app).post(baseURL + "/products").send(testproduct[1]).expect(400) 
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
        })
    })

    describe("PATCH /products/:model", () => {
        let quantitytoadd : number = 5;
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(testproduct[0].quantity+quantitytoadd) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}`)
            .send({model : testproduct1.model, quantity: quantitytoadd, arrivalDate : ""}).expect(200)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        })

        test("It should return a 400 error code - new arrivalDate before the old one", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new DateError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}`)
            .send({model : testproduct1.model, quantity: quantitytoadd, arrivalDate : "2000/01/01"}).expect(400)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        })

        test("It should return a 400 error code - arrivalDate is in the future", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new DateError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}`)
            .send({model : testproduct1.model, quantity: quantitytoadd, arrivalDate : "2100/01/01"}).expect(400)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        })

        test("It should return a 404 error code - ProductNotFoundError", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}`)
            .send({model : testproduct1.model, quantity: quantitytoadd, arrivalDate : ""}).expect(404)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        })
    })

    describe("PATCH /products/:model/sell", () => {
        let quantitySold : number = 5;
        test("it should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(testproduct[0].quantity - quantitySold) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}/sell`)
            .send({quantity: quantitySold}).expect(200)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 404 error code - ProductNotFound ciao", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).patch(baseURL + `/products/ciao/sell`)
            .send({quantity: quantitySold}).expect(404)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 400 error code - DateError - seelingDate in the future", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new DateError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}/sell`)
            .send({sellingDate: "2100/01/01", quantity: quantitySold}).expect(400)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 400 error code - DateError - seelingDate before the arrivalDate", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new DateError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[0].model}/sell`)
            .send({sellingDate: "1200/01/01", quantity: quantitySold}).expect(400)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 409 error code - LowProductStockError", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new LowProductStockError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[3].model}/sell`)
            .send({quantity: quantitySold}).expect(409)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 409 error code - EmptyProductStockError", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new EmptyProductStockError()) 

            const response = await request(app).patch(baseURL + `/products/${testproduct[2].model}/sell`)
            .send({quantity: quantitySold}).expect(409)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        });
    });

    describe("GET /products", () => {
        test("it should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(testproduct) 

            const response = await request(app).get(baseURL + `/products`)
            .send({grouping : null, category : null, model : null})
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testproduct)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
        })

        test("it should return a 404 error code - ProductNotFound ", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).get(baseURL + `/products`)
            .send({grouping : "model", category : null, model : `${testproduct[0].model}`})
            expect(response.status).toBe(404)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
        })

        test("it should return a 422 error code - Grouping null but model and/or category not null", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error422());

            const response = await request(app).get(baseURL + `/products`)
                .query({ grouping: null, category: null, model: `${testproduct[0].model}` });
            expect(response.status).toBe(422)
        })

        test("it should return a 422 error code - Grouping = category but category null ", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error422()) 

            const response = await request(app).get(baseURL + `/products`)
            .send({grouping : "category", category : null, model : testproduct[0].model})
            expect(response.status).toBe(422)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1)
        });
    });

    describe("GET /products/available", () => {
        test("it should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([testproduct1, testproduct2, testproduct4]) 
            
            const response = await request(app).get(baseURL + `/products/available`)
            .send({grouping : null, category : null, model : null})
            expect(response.status).toBe(200)
            expect(response.body).toEqual([testproduct1, testproduct2, testproduct4])
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
        })

        test("it should return a 404 error code - ProductNotFound", async () => {
            jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).get(baseURL + `/products/available`)
            .send({grouping : null, category : null, model : null})
            expect(response.status).toBe(404)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
        })

        test("it should return a 422 error code - Grouping null but model and/or category not null", async () => {
            jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new Error422());

            const response = await request(app).get(baseURL + `/products/available`)
                .query({ grouping: null, category: null, model: testproduct[0].model });
            expect(response.status).toBe(422)
        })

        test("it should return a 422 error code - Grouping = category but category null ", async () => {
            jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new Error422()) 

            const response = await request(app).get(baseURL + `/products/available`)
            .send({grouping : "category", category : null, model : testproduct[0].model})
            expect(response.status).toBe(422)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
        })
    })

    describe("DELETE /products/:model", () => {
        test("it should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true) 

            const response = await request(app).delete(baseURL + `/products/${testproduct[0].model}`)
            .send(`${testproduct[0].model}`)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1)
        })

        test("it should return a 404 error code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).delete(baseURL + `/products/${testproduct[0].model}`)
            .send(`ciao`)
            expect(response.status).toBe(404)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1)
        })
    })

    describe("DELETE /products", () => {
        test("it should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValue(true) 

            const response = await request(app).delete(baseURL + `/products`)
            .send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
        })

        test("it should return a 404 error code", async () => {
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new ProductNotFoundError()) 

            const response = await request(app).delete(baseURL + `/products/${testproduct[0].model}`)
            .send(`ciao`)
            expect(response.status).toBe(404)
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1)
        })
    })
})