import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import {Role, User} from "../../src/components/user"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError";

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

afterEach(()=>{
    jest.restoreAllMocks()
    jest.clearAllMocks()
})

describe("UserDAO unit testing", ()=>{

    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    }

    describe("createUser test cases",()=>{

        //Example of unit test for the createUser method
        //It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
        //It then calls the createUser method and expects it to resolve true

        test("It should resolve true", async () => {
            const userDAO = new UserDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
        })

        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
        
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error('UNIQUE constraint failed: users.username'))
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
        
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toEqual(new UserAlreadyExistsError);
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })

    describe("getUserByUsername test cases", ()=>{
        test("it should resolve to the correct user", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testUser)
                return {} as Database
            });
        
            const result = await userDAO.getUserByUsername(testUser.surname)
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toEqual(new User(testUser.username, testUser.name, testUser.surname, testUser.role, testUser.address, testUser.birthdate))
        })
        
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.getUserByUsername("test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback('error', {})
                return {} as Database
            });
        
            await expect(userDAO.getUserByUsername("test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, user not found", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            });
        
            await expect(userDAO.getUserByUsername("test")).rejects.toEqual(new UserNotFoundError());
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })

    describe("getUsers test cases", ()=>{
        test("it should resolve to the correct users list", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [testUser])
                return {} as Database
            });
        
            const result = await userDAO.getUsers()
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toEqual([new User(testUser.username, testUser.name, testUser.surname, Role.MANAGER, testUser.address, testUser.birthdate)])
        })
        
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.getUsers()).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback('error', [])
                return {} as Database
            });
        
            await expect(userDAO.getUsers()).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })

    describe("getUsersByRole test cases", ()=>{
        test("it should resolve to the correct users list", async ()=>{
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: "Manager",
                address: "test",
                birthdate: "test"
            }
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [testUser])
                return {} as Database
            });
        
            const result = await userDAO.getUsersByRole(Role.MANAGER)
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toEqual([new User(testUser.username, testUser.name, testUser.surname, Role.MANAGER, testUser.address, testUser.birthdate)])
        })
        
        //Selection based by role is done trought the db, we cant test it in the unit test of GetUsersByRoles
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback('error', [])
                return {} as Database
            });
        
            await expect(userDAO.getUsersByRole(Role.MANAGER)).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })

    describe("deletedeleteAllNonAdmin test cases", ()=>{
        test("it should resolve to true", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
        
            const result = await userDAO.deleteUserByUsername("test")
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toBe(true)
        })
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.deleteUserByUsername("test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback('error')
                return {} as Database
            });
        
            await expect(userDAO.deleteUserByUsername("test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })
    
    describe("deleteAllNonAdmin test cases", ()=>{
        test("it should resolve to true", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
        
            const result = await userDAO.deleteAllNonAdmin()
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toBe(true)
        })
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.deleteAllNonAdmin()).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback('error')
                return {} as Database
            });
        
            await expect(userDAO.deleteAllNonAdmin()).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })

    describe("updateUserByUsername test cases", ()=>{
        test("it should resolve to true", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
        
            const result = await userDAO.updateUserByUsername("test", "test", "test", "test", "test")
            expect(mockDBGet).toBeCalledTimes(1)
            expect(result).toBe(true)
        })
        
        test("it should reject, db call exception", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw 'error'
            });
        
            await expect(userDAO.updateUserByUsername("test", "test", "test", "test", "test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
        
        test("it should reject, db error", async ()=>{
        
            const userDAO = new UserDAO()
            const mockDBGet = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback('error')
                return {} as Database
            });
        
            await expect(userDAO.updateUserByUsername("test", "test", "test", "test", "test")).rejects.toMatch('error');
            expect(mockDBGet).toBeCalledTimes(1)
        })
    })
})