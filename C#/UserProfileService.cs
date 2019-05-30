using System;
using System.Threading.Tasks;
using App.Core.Entities;
using App.Core.Exceptions;
using App.Core.Interfaces;
using App.Core.Interfaces.AccountContext;
using App.Core.SharedKernel.Exceptions;
using App.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace App.Infrastructure.Services
{
    public class UserSelfCareService : IUserSelfCareService
    {
        private readonly ILogger<UserSelfCareService> _logger;
        private readonly UserManager<User> _userManager;
        private readonly IAccountRepository _accountRepository;
        private readonly IUserPasswordChangeTokenRepository _userPasswordChangeToken;
        private readonly IDomainEventDispatcher _eventDispatcher;
        private readonly AppDbContext _database;

        public UserSelfCareService(ILogger<UserSelfCareService> logger,
            UserManager<User> userManager,
            IAccountRepository accountRepository,
            IUserPasswordChangeTokenRepository userPasswordChangeToken,
            IDomainEventDispatcher eventDispatcher,
            AppDbContext database)
        {
            _logger = logger;
            _userManager = userManager;
            _accountRepository = accountRepository;
            _userPasswordChangeToken = userPasswordChangeToken;
            _eventDispatcher = eventDispatcher;
            _database = database;
        }
        
        /// <inheritdoc />
        public async Task UserChangeActiveStatusAsync(Guid accountId, Guid userId)
        {
            var user = await _accountRepository.GetUserByIdAsync(accountId, userId);

            if (user == null)
            {
                _logger.LogWarning($"User with ID {userId} not found.");
                throw new UserNotExistException(userId.ToString());
            }

            user.SetActive(!user.IsActive);
            _database.Update(user);

            await _database.SaveChangesAsync();

            _logger.LogInformation($"Acitive status changed at user {user.Id}");
        }

        /// <inheritdoc />
        public async Task UserResetPasswordRequest(Guid accountId, Guid userId)
        {
            var user = await _accountRepository.GetUserByIdAsync(accountId, userId);

            if (user == null)
            {
                _logger.LogWarning($"User with ID {userId} not found.");
                throw new UserNotExistException(userId.ToString());
            }

            if (user.IsDeleted) throw new ApplicationLogicException($"User {userId} was deleted.");

            // generate token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            _database.UserPasswordChangeTokens.Add(new UserPasswordChangeToken(user, token));
            await _database.SaveChangesAsync();

            _logger.LogInformation($"Change password request for user {user.UserNameOrigin} has been sent.");
        }

        /// <inheritdoc />
        public async Task UserResetPasswordAsync(User user, string token, string password)
        {
            if (user.IsDeleted) throw new ApplicationLogicException($"User {user.Id} was deleted.");

            if (!(await _userManager.ResetPasswordAsync(user, token, password)).Succeeded)
                throw new ApplicationLogicException($"Change password failed for user {user.Id}.");

            // send notification
            user.ChangePasswordNotification();

            // dispatch events because user not inherit from base entity
            foreach (var evt in user.Events)
            {
                _eventDispatcher.Dispatch(evt);
            }
            
            // clean request tokens
            _userPasswordChangeToken.RemoveUserTokens(user);
            await _database.SaveChangesAsync();

            _logger.LogInformation($"New password for user ID {user.Id} was set.");
        }
    }
}