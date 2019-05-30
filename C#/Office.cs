using System;
using System.Collections.Generic;
using System.Linq;
using App.Core.AccountContext;
using App.Core.BenefitContext;
using App.Core.BenefitContext.Enum;
using App.Core.Entities;
using App.Core.Events;
using App.Core.Exceptions;
using App.Core.Interfaces;
using App.Core.ModuleContext;
using App.Core.SharedKernel;
using App.Core.SharedKernel.Exceptions;
using Newtonsoft.Json;

namespace App.Core.AccountContext
{
    public class Office : BaseUpdateEntity
    {
        public Guid Id { get; private set; } = Guid.NewGuid();

        /// <summary>
        /// IP protection module
        /// </summary>
        public bool IsIpProtectEnabled { get; private set; }
        
        /// <summary>
        /// Office order number 1.2..
        /// </summary>
        public int OfficeOrderNumber { get; private set; }

        /// <summary>
        /// Last used contract sequence number
        /// </summary>
        public int LastContractSequenceNumber { get; private set; } = 0;

        public string Name { get; private set; }
        public bool CanManufacture { get; private set; }
        public string Email { get; private set; }
        public string Phone { get; private set; }
        public string PhoneMobile { get; private set; }
        public string Website { get; private set; }

        public Address Address { get; private set; }

        public Guid AccountId { get; private set; }
        public Account Account { get; private set; }

        /// <summary>
        /// Benefit system type
        /// </summary>
        public BenefitTypeEnum TypeBenefitSystem { get; private set; }
        
        public int? PointConversionBenefitSystemId { get; private set; }
        public decimal PercentRewardTurnoverValue { get; private set; } = 0;
        public BenefitPointConversion PointConversionBenefitSystem { get; private set; }
        
        [JsonIgnore]
        public List<OfficeUser> OfficeUsers { get; private set; } = new List<OfficeUser>();

        private readonly List<ModuleAccount> _modules = new List<ModuleAccount>();
        [JsonIgnore]
        public ICollection<ModuleAccount> Modules => _modules.AsReadOnly();
        
        public Office() { }

        public Office(Account account,
            int actualOfficeCountNumber,
            string name,
            bool canManufacture,
            string email,
            string phone,
            string phoneMobile,
            string website,
            Address address)
        {
            Account = account;
            OfficeOrderNumber = actualOfficeCountNumber + 1;
            Name = name;
            CanManufacture = canManufacture;
            Email = email;
            Phone = phone;
            PhoneMobile = phoneMobile;
            Website = website;
            Address = address;
            TypeBenefitSystem = BenefitTypeEnum.None;
        }

        public void Update(string name,
            string email,
            string phone,
            string phoneMobile,
            string website,
            Address address)
        {
            Name = name;
            Email = email;
            Phone = phone;
            PhoneMobile = phoneMobile;
            Website = website;
            Address = address;
        }

        public void AssignUser(OfficeUser user, ISpecification<Office, OfficeUser> specification)
        {
            if (!specification.IsSatisfiedBy(this, user))
                throw new UserCanNotBeAssignedInOfficeException(user.UserId, user.OfficeId);
                
            if(OfficeUsers.Any(o => o.UserId == user.User.Id))
                throw new UserIsAlreadyAssignedInOfficeException(user.UserId, user.OfficeId);

            OfficeUsers.Add(user);
        }

        public void RemoveUser(User user)
        {
            OfficeUsers.RemoveAll(c => c.UserId == user.Id);
        }

        public void IncreaseContractSequenceNumber()
        {
            LastContractSequenceNumber = LastContractSequenceNumber + 1;
        }

        public void ResetContractSequenceNumber()
        {
            LastContractSequenceNumber = 0;
        }

        /// <summary>
        /// Set type of benefit system which office is using
        /// </summary>
        /// <param name="type"></param>
        public void SetTypeBenefitSystem(BenefitTypeEnum type)
        {
            TypeBenefitSystem = type;
        }
        
        /// <summary>
        /// Set type of benefit system point conversion which office is using
        /// </summary>
        /// <param name="conversion"></param>
        public void SetPointConversionBenefitSystem(BenefitPointConversion conversion)
        {
            PointConversionBenefitSystem = conversion;
        }

        /// <summary>
        /// Set percentage reward from contract turnover
        /// </summary>
        /// <param name="value"></param>
        public void SetPercentRewardTurnoverBenefitSystem(decimal value)
        {
            PercentRewardTurnoverValue = value;
        }
        
        /// <summary>
        /// Enable/disable ip protection module
        /// </summary>
        /// <param name="value"></param>
        public void EnableIpProtection(bool value)
        {
            IsIpProtectEnabled = value;
        }

        /// <summary>
        /// Enable/disable office can manufacture for foreign offices
        /// </summary>
        /// <param name="value"></param>
        public void EnableCanManufacture(bool value)
        {
            if (CanManufacture != value) Events.Add(new OfficeRemoveManufactureOptionsEvent(this));
            CanManufacture = value;
        }
    }
}