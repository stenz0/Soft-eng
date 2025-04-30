import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import {Role, User} from "../../src/components/user"
import { UserNotAdminError, UnauthorizedUserError, UserInvalidDate } from "../../src/errors/userError";
import dayjs from "dayjs";

jest.mock("../../src/dao/userDAO")

afterEach(()=>{
    jest.resetAllMocks()
    jest.clearAllMocks()
})

describe("UserController unit testing", ()=>{

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

    //Example of a unit test for the createUser method of the UserController
    //The test checks if the method returns true when the DAO method returns true
    //The test also expects the DAO method to be called once with the correct parameters
    describe("createUser test cases", ()=>{
        test("It should return true", async () => {
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object
            const response = await controller.createUser(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.password, testCustomer.role);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testCustomer.username,
                testCustomer.name,
                testCustomer.surname,
                testCustomer.password,
                testCustomer.role);
            expect(response).toBe(true); //Check if the response is true
        });
    })

    describe("getUsers test cases", ()=>{
        test("it should resolve to an user list", async ()=>{
            const requested = [new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)]

            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(requested);
            const controller = new UserController();
            const response = await controller.getUsers();
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(response).toEqual(requested)
        })
    })

    describe("getUsersByRole test cases", ()=>{
        test("it should resolve to an user list", async ()=>{
            const requested = [new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)]

            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(requested);
            const controller = new UserController();
            const response = await controller.getUsersByRole(Role.MANAGER);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER);
            expect(response).toEqual(requested)
        })
    })

    describe("getUserByUsername test cases", ()=>{

        //Normal Custumer or Manager scenario (request own data)
        test("it should resolve to an user list", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = caller

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            const controller = new UserController();
            const response = await controller.getUserByUsername(caller, testCustomer.username);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(requested.username);
            expect(response).toEqual(requested)
        })

        //Normal Admin scenario
        test("it should resolve to an user list", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            const controller = new UserController();
            const response = await controller.getUserByUsername(caller, testCustomer.username);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(requested.username);
            expect(response).toEqual(requested)
        })

        //Customer or Manager try to get not others data
        test("it should reject", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)

            const controller = new UserController();
            await expect(controller.getUserByUsername(caller, requested.username)).rejects.toEqual(new UnauthorizedUserError())
        })      
    })

    describe("deleteUser test cases", ()=>{

        //Normal Custumer or Manager scenario (delete own data)
        test("it should resolve to true", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = caller

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.deleteUser(caller, testCustomer.username);
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledWith(requested.username);
            expect(response).toEqual(true)
        })

        //Normal Admin scenario (delete no others Admin data)
        test("it should resolve to true", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockResolvedValueOnce(true);
            const controller = new UserController();
            await expect(controller.deleteUser(caller, testCustomer.username)).resolves.toEqual(true)
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledWith(requested.username);
        })

        //Customer or Manager try to delete not others data
        test("it should reject", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)

            const controller = new UserController();
            await expect(controller.deleteUser(caller, requested.username)).rejects.toEqual(new UserNotAdminError())
        })
        
        //Admin try to get delete other admin data
        test("it should reject", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User("otherAdmin", testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(requested);
            const controller = new UserController();
            await expect(controller.deleteUser(caller, requested.username)).rejects.toEqual(new UnauthorizedUserError())
        }) 
    })

    describe("deleteAll test cases", ()=>{
        test("it should resolve to true", async ()=>{
            jest.spyOn(UserDAO.prototype, "deleteAllNonAdmin").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.deleteAll();
            expect(UserDAO.prototype.deleteAllNonAdmin).toHaveBeenCalledTimes(1);
            expect(response).toEqual(true)
        })
    })

    describe("updateUserInfo test cases", ()=>{

        //Normal Custumer or Manager scenario (update own data)
        test("it should resolve to the updated user", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = caller

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            jest.spyOn(UserDAO.prototype, "updateUserByUsername").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.updateUserInfo(caller, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, caller.username);
            expect(UserDAO.prototype.updateUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserByUsername).toHaveBeenCalledWith(requested.name, requested.surname, requested.address, requested.birthdate, requested.username);
            expect(response).toEqual(caller)
        })

        //Normal Admin scenario
        test("it should resolve to the updated user", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            jest.spyOn(UserDAO.prototype, "updateUserByUsername").mockResolvedValueOnce(true);
            const controller = new UserController();
            const response = await controller.updateUserInfo(caller, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, requested.username);
            expect(UserDAO.prototype.updateUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserByUsername).toHaveBeenCalledWith(requested.name, requested.surname, requested.address, requested.birthdate, requested.username);
            expect(response).toEqual(requested)
        })

        test("invalid birthdate, it should reject", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, dayjs().add(1, 'day').format("YYYY-MM-DD"))

            const controller = new UserController();
            await expect(controller.updateUserInfo(caller, testCustomer.name, testCustomer.surname, testCustomer.address, requested.birthdate, requested.username)).rejects
            .toEqual(new UserInvalidDate())
        })

        //Customer or Manager try to update others data
        test("it should rejest ", async ()=>{
            const caller = new User(testCustomer.username, testCustomer.name, testCustomer.surname, testCustomer.role, testCustomer.address, testCustomer.birthdate)
            const requested = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            jest.spyOn(UserDAO.prototype, "updateUserByUsername").mockResolvedValueOnce(true);
            const controller = new UserController();
            await expect(controller.updateUserInfo(caller, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, requested.username)).rejects.toEqual(new UserNotAdminError)
            
        })

        //Admin try to update another admin data
        test("it should rejest ", async ()=>{
            const caller = new User(testAdmin.username, testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)
            const requested = new User("otherAdmin", testAdmin.name, testAdmin.surname, testAdmin.role, testAdmin.address, testAdmin.birthdate)

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requested);
            const controller = new UserController();
            await expect(controller.updateUserInfo(caller, testAdmin.name, testAdmin.surname, testAdmin.address, testAdmin.birthdate, requested.username)).rejects.toEqual(new UnauthorizedUserError)
        })
    })
})

