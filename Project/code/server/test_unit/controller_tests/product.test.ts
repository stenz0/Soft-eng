import { test, expect, jest, afterEach, describe } from "@jest/globals";
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from "../../src/components/product"
import { ProductAlreadyExistsError, ProductNotFoundError, ProductSoldError, 
    LowProductStockError, EmptyProductStockError } from "../../src/errors/productError";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/productDAO");
jest.mock("../../src/db/db");


afterEach(()=>{
    jest.resetAllMocks()
    jest.clearAllMocks()
})

describe("ProductController unit testing", ()=>{

    const testSmartphone = {
        sellingPrice: 50.00,
        model: "Samsung GalaxyA54",
        category: Category.SMARTPHONE,
        arrivalDate: "",
        details: "",
        quantity: 50
    }

    const testAppliance = {
        sellingPrice: 10.00,
        model: "Alexa",
        category: Category.APPLIANCE,
        arrivalDate: "2050-01-01",
        details: "",
        quantity: 20
    }

    const testLaptop = {
        sellingPrice: 200.00,
        model: "Hp PC",
        category: Category.LAPTOP,
        arrivalDate: "",
        details: "",
        quantity: 0
    }

    // Example of a unit test for the newModel method of the UserProduct
    // The test checks if the method returns undefined when the DAO method returns Promise<void>
    // The test also expects the DAO method to be called once with the correct parameters
    describe("createProduct test cases", ()=>{
        test("It should return undefined", async () => {
            jest.spyOn(ProductDAO.prototype, "newModel").mockResolvedValueOnce(undefined); //Mock the newModel method of the DAO
            const controller = new ProductController(); //Create a new instance of the controller
            //Call the registerProducts method of the controller with the test object
            const response = await controller.registerProducts(testSmartphone.model, testSmartphone.category, testSmartphone.quantity, 
                testSmartphone.details, testSmartphone.sellingPrice, testSmartphone.arrivalDate);
        
            //Check if the newModel method of the DAO has been called once with the correct parameters
            expect(ProductDAO.prototype.newModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.newModel).toHaveBeenCalledWith(
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.quantity, 
                testSmartphone.details, 
                testSmartphone.sellingPrice, 
                testSmartphone.arrivalDate);
            expect(response).toBe(undefined); //Check if the response is undefined
        });

        test('It should throws DateError', async () => {

        // Configure mock to reject the Promise
        const error = new DateError();
        const controller = new ProductController(); //Create a new instance of the controller

        jest.spyOn(ProductDAO.prototype, "newModel").mockRejectedValueOnce(error);

        await expect(controller.registerProducts(testAppliance.model, 
            testAppliance.category, 
            testAppliance.quantity, 
            testAppliance.details, 
            testAppliance.sellingPrice, 
            testAppliance.arrivalDate)).rejects.toThrow(error);
        });

        test('It should throws ProductAlreadyExistsError', async () => {

            // Configure mock to reject the Promise
            const error = new ProductAlreadyExistsError();
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "newModel").mockRejectedValueOnce(error);
    
            await expect(controller.registerProducts(testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.quantity, 
                testSmartphone.details, 
                testSmartphone.sellingPrice, 
                testSmartphone.arrivalDate)).rejects.toThrow(error);
            });
    });

    describe("changeProductQuantity test cases", ()=>{
        test("It should return 55", async() => {
            jest.spyOn(ProductDAO.prototype, "updateModel").mockResolvedValueOnce(55);
            const controller = new ProductController(); //Create a new instance of the controller
            //Call the changeProductQuantity method of the controller with the test object
            const response = await controller.changeProductQuantity(testSmartphone.model, 5, null);
        
            //Check if the newModel method of the DAO has been called once with the correct parameters
            expect(ProductDAO.prototype.updateModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.updateModel).toHaveBeenCalledWith(
                testSmartphone.model, 5, null);
            expect(response).toBe(55); //Check if the response is the quantity, so 50, + 5
        });

        test('It should reject DateError 1', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "updateModel").mockRejectedValueOnce(new DateError());
    
            await expect(controller.changeProductQuantity(testAppliance.model, 5, testAppliance.arrivalDate)).rejects.toEqual(new DateError());
        });

        test('It should reject DateError 2', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "updateModel").mockRejectedValueOnce(new DateError());
    
            await expect(controller.changeProductQuantity(testAppliance.model, 5, "1900/01/01")).rejects.toEqual(new DateError());
        });

        test('It should reject ProductNotFoundError', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "updateModel").mockRejectedValueOnce(new ProductNotFoundError());
    
            await expect(controller.changeProductQuantity("ababababa", 5, "")).rejects.toEqual(new ProductNotFoundError());
        });
    });

    describe("sellProduct test cases", ()=>{
        test("It should return 45", async() => {
            jest.spyOn(ProductDAO.prototype, "sellModel").mockResolvedValueOnce(45);
            const controller = new ProductController(); //Create a new instance of the controller
            //Call the sellProduct method of the controller with the test object
            const response = await controller.sellProduct(testSmartphone.model, 5, null);
        
            //Check if the newModel method of the DAO has been called once with the correct parameters
            expect(ProductDAO.prototype.sellModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.sellModel).toHaveBeenCalledWith(
                testSmartphone.model, 5, null);
            expect(response).toBe(45); //Check if the response is the quantity, so 50, - 5
        });

        test('It should reject DateError', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "sellModel").mockRejectedValueOnce(new DateError());
            // ArrivalDate used as sellingDate only because it is 2050/01/01 and it works
            await expect(controller.sellProduct(testAppliance.model, 5, testAppliance.arrivalDate)).rejects.toEqual(new DateError());
        });

        test('Should reject LowProductStockError', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "sellModel").mockRejectedValueOnce(new LowProductStockError());
            // ArrivalDate used as sellingDate only because it is 2050/01/01 and it works
            await expect(controller.sellProduct(testSmartphone.model, 500, testSmartphone.arrivalDate)).rejects.toEqual(new LowProductStockError());
        });

        test('Should reject EmptyProductStockError', async () => {

            // Configure mock to reject the Promise
            const controller = new ProductController(); //Create a new instance of the controller
    
            jest.spyOn(ProductDAO.prototype, "sellModel").mockRejectedValueOnce(new EmptyProductStockError());
            // ArrivalDate used as sellingDate only because it is 2050/01/01 and it works
            await expect(controller.sellProduct(testLaptop.model, 500, testLaptop.arrivalDate)).rejects.toEqual(new EmptyProductStockError());
        });
    });

    describe("getProducts test cases", ()=>{
        test("it should resolve to a list of three products", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                ), 
                new Product(testAppliance.sellingPrice, 
                testAppliance.model, 
                testAppliance.category, 
                testAppliance.arrivalDate, 
                testAppliance.details, 
                testAppliance.quantity
                ),
                new Product(testLaptop.sellingPrice, 
                testLaptop.model, 
                testLaptop.category, 
                testLaptop.arrivalDate, 
                testLaptop.details, 
                testLaptop.quantity)];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getProducts(null, null, null);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test("It should resolve to a list of one product - grouped by model", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                )];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getProducts("model", testSmartphone.model, null);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test("It should resolve to a list of one product - grouped by category", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                )];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getProducts("category", null, testSmartphone.category);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test('group = model but model is null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getProducts("model", null, null)).rejects.toEqual(new Error());
        });

        test('group = category but category is null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getProducts("category", null, null)).rejects.toEqual(new Error());
        });

        test('group = model but category is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getProducts("model", testSmartphone.model, "bla")).rejects.toEqual(new Error());
        });

        test('group = category but model is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getProducts("category", "bla", testSmartphone.category)).rejects.toEqual(new Error());
        });
    });

    describe("getAvailableProducts test cases", ()=>{
        test("It should resolve to a product list", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                ), 
                new Product(testAppliance.sellingPrice, 
                testAppliance.model, 
                testAppliance.category, 
                testAppliance.arrivalDate, 
                testAppliance.details, 
                testAppliance.quantity)];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getAvailableProducts(null, null, null);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test("It should resolve to a list of one product - grouped by model", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                )];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getAvailableProducts("model", testSmartphone.model, null);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test("It should resolve to a list of one product - grouped by categpry", async ()=>{
            const requested = [new Product( testSmartphone.sellingPrice, 
                testSmartphone.model, 
                testSmartphone.category, 
                testSmartphone.arrivalDate, 
                testSmartphone.details, 
                testSmartphone.quantity
                )];
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(requested);
            const controller = new ProductController();
            const response = await controller.getAvailableProducts("category", null, testSmartphone.category);
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        });

        test('group = model but category is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getAvailableProducts("model", testSmartphone.model, "bla")).rejects.toEqual(new Error());
        });

        test('group = category but model is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getAvailableProducts("category", "bla", testSmartphone.category)).rejects.toEqual(new Error());
        });

        test('group = model but category is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getAvailableProducts("model", testSmartphone.model, testSmartphone.category)).rejects.toEqual(new Error());
        });

        test('group = category but model is not null -> Error', async () => {
            const controller = new ProductController();
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockRejectedValueOnce(new Error());
            await expect(controller.getAvailableProducts("category", "bla", testSmartphone.category)).rejects.toEqual(new Error());
        });
    });

    describe("deleteAllProducts test cases", ()=>{
        test("It should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true); //Mock the deleteAllProducts method of the DAO
            const controller = new ProductController(); //Create a new instance of the controller
            //Call the deleteProducts method of the controller with the test object
            const response = await controller.deleteAllProducts();
        
            //Check if the deleteAllProducts method of the DAO has been called once with the correct parameters
            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledWith();
            expect(response).toBe(true); //Check if the response is true
        });
    });

    describe("deleteProduct test cases", ()=>{
        test("It should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteOneProduct").mockResolvedValueOnce(true); //Mock the deleteAllProducts method of the DAO
            const controller = new ProductController(); //Create a new instance of the controller
            //Call the deleteProduct method of the controller with the test object
            const response = await controller.deleteProduct(testAppliance.model);
        
            //Check if the deleteOneProduct method of the DAO has been called once with the correct parameters
            expect(ProductDAO.prototype.deleteOneProduct).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.deleteOneProduct).toHaveBeenCalledWith(testAppliance.model);
            expect(response).toBe(true); //Check if the response is true
        }); 
    });
});