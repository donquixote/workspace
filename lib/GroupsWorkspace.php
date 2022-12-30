<?php

namespace OCA\Workspace;

class GroupsWorkspace
{
	public const SPACE_MANAGER = 'GE-';
    public const SPACE_USERS = 'U-';
    public const GID_SPACE = 'SPACE-';
	public const USER_GROUP = 'Users-';

	public static function getUserGroup(array $workspace): string
	{
		$groups = array_keys($workspace['groups']);

		$regex = '/^' . self::GID_SPACE . self::SPACE_USERS . '[0-9]/';
		foreach ($groups as $group)
		{
			if (preg_match($regex, $group))
			{
				return self::GID_SPACE . self::SPACE_USERS;
			}
		}

		return self::GID_SPACE . self::USER_GROUP;
	}
}
