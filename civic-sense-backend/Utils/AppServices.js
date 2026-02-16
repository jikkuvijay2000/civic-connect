
const getUserDetails = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        return user;
    } catch (error) {
        return error;
    }
}

module.exports = {
    getUserDetails
}