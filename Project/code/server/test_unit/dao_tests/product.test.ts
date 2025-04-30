import { test, expect, jest, afterEach, beforeEach, describe } from "@jest/globals";
import ProductDAO from "../../src/dao/productDAO";
import db from "../../src/db/db";
import { Product, Category } from "../../src/components/product";
import { ProductAlreadyExistsError, ProductNotFoundError, ProductSoldError, LowProductStockError, EmptyProductStockError } from "../../src/errors/productError";
import { DateError } from "../../src/utilities";

jest.mock('../../src/db/db');

const testProduct = {
  model: "prod",
  category: Category.SMARTPHONE,
  quantity: 50,
  details: "",
  sellingPrice: 50.00,
  arrivalDate: ""
};

const testErr = {
  model: "",
  category: "ciao",
  quantity: -5,
  details: "",
  sellingPrice: -3.00,
  arrivalDate: "2100-01-01"
};

describe("ProductDAO unit testing", () => {
  let productDAO: ProductDAO;

  beforeEach(() => {
    productDAO = new ProductDAO();
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("createProduct test cases", () => {
    test("It should resolve with undefined", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        return callback(null, null);  // Mock table creation
      }).mockImplementationOnce((sql, parameters, callback) => {
        return callback(null, null);  // Mock insert into table
      });

      await expect(productDAO.newModel(testProduct.model, testProduct.category, testProduct.quantity, 
        testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).resolves.toBeUndefined();
  
      expect(mockDBRun).toHaveBeenCalledTimes(2);
      expect(mockDBRun).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    });

    test("It should reject - problem with creation of new table", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        return callback(new Error("Table creation error"));  // Mock table creation error
      }).mockImplementationOnce((sql, parameters, callback) => {
        return callback(null);  // Mock insert (should not be called)
      });
  
      await expect(productDAO.newModel(testProduct.model, testProduct.category, testProduct.quantity, 
        testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toBeInstanceOf(Error);
  
      expect(mockDBRun).toHaveBeenCalledTimes(1);
    });

    test("It should reject - Product already exists error", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        return callback(null, null);  // Mock table creation
      }).mockImplementationOnce((sql, parameters, callback) => {
        return callback(new Error("Inserting error"));  // Mock insert error
      });

      await expect(productDAO.newModel(testProduct.model, testProduct.category, testProduct.quantity, 
        testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toBeInstanceOf(ProductAlreadyExistsError);

      expect(mockDBRun).toHaveBeenCalledTimes(2);
      expect(mockDBRun).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    });
  });

  describe("updateModel test cases", () => {
    test('updateModel should update the model quantity and arrival date', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { quantity : 50, arrivalDate: '' });  // Mock fetching old arrival date
      });

      const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
        return callback(null);  // Mock update query
      });

      await expect(productDAO.updateModel(testProduct.model, 5, '')).resolves.toEqual(55);
      expect(mockDBget).toBeCalledTimes(1);
      expect(mockDBRun).toBeCalledTimes(1);
      expect(mockDBRun).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    });

    test('updateModel - product not found error', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, null);  // Mock product not found
      });

      await expect(productDAO.updateModel(testProduct.model, 5, testProduct.arrivalDate)).rejects.toBeInstanceOf(ProductNotFoundError);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('updateModel - date input error', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { quantity : 50, arrivalDate: '2000-01-01' });  // Mock fetching old arrival date
      });

      await expect(productDAO.updateModel(testProduct.model, 5, '1999-01-01')).rejects.toBeInstanceOf(DateError);
      expect(mockDBget).toBeCalledTimes(1);
    });
  });

  describe('sellModel test cases', () => {
    test('sellModel should update the model quantity', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2024-01-01', quantity: 15 });  // Mock fetching product
      });

      const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
        return callback(null);  // Mock successful update
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).resolves.toEqual(10);
      expect(mockDBget).toBeCalledTimes(1);
      expect(mockDBRun).toBeCalledTimes(1);
    });

    test('sellModel should throw ProductNotFoundError if model does not exist', async () => {
      jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        return callback(null, undefined);  // Mock product not found
      });

      await expect(productDAO.sellModel(testProduct.model, 1, null)).rejects.toBeInstanceOf(ProductNotFoundError);
    });

    test('sellModel should throw DateError', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2040-01-01', quantity: 15 });  // Mock future arrival date
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(DateError);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('sellModel should throw EmptyStockError', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2024-01-01', quantity: 0 });  // Mock empty stock
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(EmptyProductStockError);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('sellModel should throw LowStockError', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2024-01-01', quantity: 1 });  // Mock low stock
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(LowProductStockError);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('sellModel should throw generic Error', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(new Error(), null); 
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(Error);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('sellModel should throw DateError', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2040-01-01', quantity: 15 });  // Mock future arrival date
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(DateError);
      expect(mockDBget).toBeCalledTimes(1);
    });

    test('sellModel should throw DateError', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2020-01-01', quantity: 15 });  // Mock future arrival date
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2100-02-02')).rejects.toBeInstanceOf(DateError);
      expect(mockDBget).toBeCalledTimes(0);
    });

    test('sellModel should throw generic Error', async () => {
      const mockDBget = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) => {
        return callback(null, { arrivalDate: '2024-01-01', quantity: 17 });  // Mock fetching product
      });

      const mockDBRun = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) => {
        return callback(new Error());  
      });

      await expect(productDAO.sellModel(testProduct.model, 5, '2024-02-02')).rejects.toBeInstanceOf(Error);
      expect(mockDBget).toBeCalledTimes(1);
      expect(mockDBRun).toBeCalledTimes(1);
    });
  });

  describe("getAllProduct test cases", () => {
    test('getAllProducts should return all products', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(null, [
          { model: 'prod', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod1', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod2', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod3', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
        ]);
      });

      const products = await productDAO.getAllProducts(null, null, null);
      expect(products.length).toEqual(4);
      expect(mockAll).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    });

    test('getAllProducts should return all products', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(null, [
          { model: 'prod', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod1', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod2', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
          { model: 'prod3', category: Category.SMARTPHONE, quantity: 10, details: '', sellingPrice: 1000, arrivalDate: '2023-01-01' },
        ]);
      });

      const products = await productDAO.getAllProducts("category", Category.SMARTPHONE, null);
      expect(products.length).toEqual(4);
      expect(mockAll).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    });

    test('getAllProducts should return a product not found error', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(null, []);
      });

      await expect(productDAO.getAllProducts("model", null, "prod0")).rejects.toBeInstanceOf(ProductNotFoundError);
    });

    test('getAllProducts should return a generic Error', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(new Error(), []);
      });

      await expect(productDAO.getAllProducts("model", null, "prod0")).rejects.toBeInstanceOf(Error);
    });

    test('getAllProducts should return a generic Error', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(new Error(), []);
      });

      await expect(productDAO.getAllProducts("model", null, null)).rejects.toBeInstanceOf(Error);
    });

    test('getAllProducts should return a generic Error', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(new Error(), []);
      });

      await expect(productDAO.getAllProducts("category", null, "prod0")).rejects.toBeInstanceOf(Error);
    });

    test('getAllProducts should return a generic Error', async () => {
      const mockAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
        return callback(new Error(), []);
      });

      await expect(productDAO.getAllProducts(null, null, "prod0")).rejects.toBeInstanceOf(Error);
    });
  });

  describe("delete all product test cases", () => {
    test("deleteAllProduct should return a generic error", async () => {
      const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        return callback(new Error());
      });

      await expect(productDAO.deleteAllProducts()).rejects.toBeInstanceOf(Error);
    });
  });

  describe("delete one product test cases", () => {
    test('deleteOneProduct should delete a specific product', async () => {
      const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        return callback(null);
      });

      await expect(productDAO.deleteOneProduct(testProduct.model)).resolves.toBe(true);
      expect(mockRun).toHaveBeenCalledWith(expect.any(String), [testProduct.model], expect.any(Function));
    });

    test('deleteOneProduct should return a specific error', async () => {
      const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
        return callback(new Error());
      });

      await expect(productDAO.deleteOneProduct(testProduct.model)).rejects.toBeInstanceOf(Error);
      expect(mockRun).toHaveBeenCalledWith(expect.any(String), [testProduct.model], expect.any(Function));
    });
  });

  describe("getProductByModel test cases", () => {
    test('should return a ProductNotFoundError when no product is found', async () => {
      jest.resetAllMocks();
      const mockGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        return callback(null, null);
      });

      await expect(productDAO.getProductByModel('nonExistentModel1')).rejects.toBeInstanceOf(ProductNotFoundError);
    });

    test('should return an error when there is a database error', async () => {
      const mockGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
        return callback(new Error('Database error'), null);
      });

      await expect(productDAO.getProductByModel('testModel')).rejects.toBeInstanceOf(Error);
    });
  });
});
